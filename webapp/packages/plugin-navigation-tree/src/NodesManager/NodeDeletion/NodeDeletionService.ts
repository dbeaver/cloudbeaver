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

import { executeNodeDeletionPlan, type INodeDeletionItem, type INodeDeletionProvider } from './NodeDeletionPlan.js';

const NodeDeletionDialog = lazy(async () => {
  const { NodeDeletionDialog } = await import('./NodeDeletionDialog.js');
  return { default: NodeDeletionDialog };
});

@injectable(() => [CommonDialogService, NotificationService, LocalizationService, NavNodeInfoResource, ProjectInfoResource])
export class NodeDeletionService {
  private readonly providers: INodeDeletionProvider[] = [];
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
    this.providers.push(provider);
  }

  canDelete(nodes: NavNode[]): boolean {
    return this.getNodes(nodes).some(node => this.providers.some(provider => provider.isApplicable(node) && !provider.isDisabled?.(node)));
  }

  async delete(nodes: NavNode[]): Promise<void> {
    if (this.deleting) {
      return;
    }
    this.deleting = true;
    try {
      const items: INodeDeletionItem[] = [];
      const skippedAncestors = new Set<string>();
      for (const node of this.getNodes(nodes)) {
        const provider = this.providers.find(provider => provider.isApplicable(node));
        if (!provider || provider.isDisabled?.(node)) {
          this.navNodeInfoResource.getParents(node.uri).forEach(id => skippedAncestors.add(id));
          continue;
        }
        const target = await provider.getInfo(node);
        const ancestors = await this.navNodeInfoResource.resolveParents(node.uri);
        items.push({
          ...target,
          reason: target.reason ?? (provider.isDisabled?.(node) ? 'plugin_navigation_tree_delete_unavailable' : undefined),
          node,
          provider,
          ancestors,
          project: (node.projectId && this.projectInfoResource.get(node.projectId)?.name) || node.projectId || '',
          location: ancestors
            .filter(id => id !== ROOT_NODE_PATH && id !== target.locationRoot)
            .map(id => this.navNodeInfoResource.get(id)?.name)
            .filter(Boolean)
            .join('/'),
        });
      }
      const unavailableAncestors = new Set([...skippedAncestors, ...items.filter(item => item.reason).flatMap(item => item.ancestors)]);
      for (const item of items) {
        if (!item.reason && unavailableAncestors.has(item.node.uri)) {
          item.reason = 'plugin_navigation_tree_delete_dependent_unavailable';
        }
      }
      const deletableItems = items.filter(item => !item.reason && item.provider);
      if (!deletableItems.length) {
        return;
      }
      const { status } = await this.commonDialogService.open(NodeDeletionDialog, { items: deletableItems });
      if (status !== DialogueStateResult.Resolved) {
        return;
      }
      const results = await executeNodeDeletionPlan(deletableItems);
      const unresolved = results.filter(result => result.status !== 'deleted' && !result.item.reason);
      if (unresolved.length) {
        this.notificationService.logError({
          title: 'plugin_navigation_tree_delete_incomplete',
          message: unresolved
            .map(({ item, status, error }) => {
              const reason = error instanceof Error ? error.message : this.localizationService.translate(`plugin_navigation_tree_delete_${status}`);
              return `${item.project} / ${item.node.name}: ${reason}`;
            })
            .join('\n'),
        });
      }
    } catch (exception: any) {
      this.notificationService.logException(exception, 'plugin_navigation_tree_delete_incomplete');
    } finally {
      runInAction(() => {
        this.deleting = false;
      });
    }
  }

  private getNodes(nodes: NavNode[]): NavNode[] {
    return [...new Map(nodes.map(node => [node.uri, node])).values()].filter(
      node => !isProjectNode(node) && !this.providers.some(provider => provider.isHidden?.(node)),
    );
  }
}
