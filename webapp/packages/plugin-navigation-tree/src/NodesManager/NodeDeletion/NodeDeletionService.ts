/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, makeObservable, observable, runInAction } from 'mobx';
import { lazy } from 'react';

import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { isProjectNode, type NavNode, NavNodeInfoResource, ROOT_NODE_PATH } from '@cloudbeaver/core-navigation-tree';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';

import {
  executeNodeDeletionPlan,
  prepareNodeDeletionPlan,
  type INodeDeletionExclusion,
  type INodeDeletionItem,
  type INodeDeletionProvider,
  type INodeDeletionResult,
} from './NodeDeletionPlan.js';
import type { INodeDeletionDialogItem } from './NodeDeletionDialog.js';

const NodeDeletionDialog = lazy(async () => {
  const { NodeDeletionDialog } = await import('./NodeDeletionDialog.js');
  return { default: NodeDeletionDialog };
});

@injectable(() => [CommonDialogService, NotificationService, LocalizationService, NavNodeInfoResource, ProjectInfoResource])
export class NodeDeletionService {
  private readonly providers = new Set<INodeDeletionProvider>();
  private deleting = false;

  get isDeleting(): boolean {
    return this.deleting;
  }

  constructor(
    private readonly commonDialogService: CommonDialogService,
    private readonly notificationService: NotificationService,
    private readonly localizationService: LocalizationService,
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly projectInfoResource: ProjectInfoResource,
  ) {
    makeObservable<this, 'providers' | 'deleting'>(this, {
      providers: observable.shallow,
      deleting: observable,
      isDeleting: computed,
      registerProvider: action,
      delete: action,
    });
  }

  registerProvider(provider: INodeDeletionProvider): void {
    this.providers.add(provider);
  }

  canDelete(nodes: NavNode[]): boolean {
    return nodes.some(node => !this.resolveProvider(node).reason);
  }

  async delete(nodes: NavNode[]): Promise<void> {
    if (this.deleting || !this.canDelete(nodes)) {
      return;
    }
    this.deleting = true;
    try {
      const { items, rows } = await this.prepare(nodes);
      const selected = await this.confirm(items, rows);
      if (!selected.length) {
        return;
      }
      const results = await executeNodeDeletionPlan(selected);
      this.notify(results, rows);
    } catch (exception: any) {
      this.notificationService.logException(exception, 'plugin_navigation_tree_delete_incomplete');
    } finally {
      runInAction(() => {
        this.deleting = false;
      });
    }
  }

  private async prepare(nodes: NavNode[]): Promise<{ items: INodeDeletionItem[]; rows: INodeDeletionDialogItem[] }> {
    const items: INodeDeletionItem[] = [];
    const exclusions: INodeDeletionExclusion[] = [];
    const rows = new Map<string, INodeDeletionDialogItem>();
    for (const node of new Map(nodes.map(node => [node.uri, node])).values()) {
      const { provider, reason } = this.resolveProvider(node);
      const target = provider && !provider.isHidden?.(node) ? await provider.getInfo(node) : { type: 'plugin_navigation_tree_delete_object' };
      const parents = await this.navNodeInfoResource.resolveParents(node.uri);
      const unavailable = target.reason ?? reason ?? this.resolveProvider(node).reason;
      if (unavailable || !provider) {
        exclusions.push({ node, parents, reason: unavailable ?? 'plugin_navigation_tree_delete_unavailable' });
      } else {
        items.push({ node, provider, parents });
      }
      rows.set(node.uri, {
        id: node.uri,
        parents,
        keepChildren: provider?.keepChildren,
        name: node.name || node.uri,
        icon: node.icon,
        type: target.type,
        readOnly: target.readOnly,
        warning: target.warning,
        project: (node.projectId && this.projectInfoResource.get(node.projectId)?.name) || node.projectId || '',
        location: parents
          .filter(id => id !== ROOT_NODE_PATH && id !== target.locationRoot)
          .map(id => this.navNodeInfoResource.get(id)?.name)
          .filter(Boolean)
          .join('/'),
      });
    }
    const plan = prepareNodeDeletionPlan(items, exclusions);
    for (const exclusion of plan.exclusions) {
      rows.get(exclusion.node.uri)!.reason = exclusion.reason;
    }
    return { items: plan.items, rows: [...rows.values()] };
  }

  private async confirm(items: INodeDeletionItem[], rows: INodeDeletionDialogItem[]): Promise<INodeDeletionItem[]> {
    if (!items.length) {
      return [];
    }
    const { status, result } = await this.commonDialogService.open(NodeDeletionDialog, { items: rows });
    if (status !== DialogueStateResult.Resolved || !result?.length) {
      return [];
    }
    const selected = new Set(result);
    return prepareNodeDeletionPlan(
      items.filter(item => selected.has(item.node.uri)),
      items
        .filter(item => !selected.has(item.node.uri))
        .map(item => ({
          ...item,
          reason: 'plugin_navigation_tree_delete_not_selected',
        })),
    ).items;
  }

  private notify(results: INodeDeletionResult[], rows: INodeDeletionDialogItem[]): void {
    const deletedCount = results.filter(result => result.status === 'deleted').length;
    const summary = this.localizationService.translate(
      results.some(result => result.status === 'unknown') ? 'plugin_navigation_tree_delete_result_confirmed' : 'plugin_navigation_tree_delete_result',
      undefined,
      { count: deletedCount, total: results.length },
    );
    const projects = new Map(rows.map(row => [row.id, row.project]));
    const label = (item: INodeDeletionItem) => `${projects.get(item.node.uri)} / ${item.node.name}`;
    const errors = new Map<INodeDeletionItem | readonly INodeDeletionItem[], string>();
    for (const { item, status, error, batch } of results) {
      if (status === 'deleted' || errors.has(batch ?? item)) {
        continue;
      }
      if (status === 'unknown') {
        const message = this.localizationService.translate('plugin_navigation_tree_delete_unknown');
        errors.set(batch!, `${batch!.map(label).join(', ')}: ${message}${error instanceof Error ? `\n${error.message}` : ''}`);
      } else {
        const reason = error instanceof Error ? error.message : this.localizationService.translate(`plugin_navigation_tree_delete_${status}`);
        errors.set(item, `${label(item)}: ${reason}`);
      }
    }
    if (deletedCount > 0) {
      this.notificationService.logSuccess({
        title: 'plugin_navigation_tree_delete_success',
        message: summary,
      });
    }
    if (errors.size) {
      this.notificationService.logError({
        title: deletedCount > 0 ? 'plugin_navigation_tree_delete_partial' : 'plugin_navigation_tree_delete_incomplete',
        message: [...errors.values()].join('\n'),
      });
    }
  }

  private resolveProvider(node: NavNode): { provider?: INodeDeletionProvider; reason?: string } {
    const provider = isProjectNode(node) ? undefined : Array.from(this.providers).find(provider => provider.isApplicable(node));
    const unavailable = !provider || provider.isHidden?.(node) || provider.isDisabled?.(node);
    return { provider, reason: unavailable ? 'plugin_navigation_tree_delete_unavailable' : undefined };
  }
}
