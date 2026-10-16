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
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { Executor, ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { DATA_CONTEXT_NAV_NODE, type NavNode, NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';

import { executeNodeDeletionPlan, type INodeDeletionItem, type INodeDeletionDialogItem, type INodeDeletionResult } from './NodeDeletionPlan.js';
import { nodeDeletionPlanContext } from './nodeDeletionPlanContext.js';
import { DATA_CONTEXT_ELEMENTS_TREE } from '../../NavigationTree/ElementsTree/DATA_CONTEXT_ELEMENTS_TREE.js';

const NodeDeletionDialog = lazy(async () => {
  const { NodeDeletionDialog } = await import('./NodeDeletionDialog.js');
  return { default: NodeDeletionDialog };
});

@injectable(() => [CommonDialogService, NotificationService, LocalizationService, NavNodeInfoResource, ProjectInfoResource])
export class NodeDeletionService {
  readonly prepareDeletion = new Executor<NavNode[]>();
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
    makeObservable<this, 'deleting'>(this, {
      deleting: observable,
      isDeleting: computed,
      delete: action,
    });
  }

  async deleteSelection(context: IDataContextProvider): Promise<void> {
    const node = context.get(DATA_CONTEXT_NAV_NODE);
    if (!node) {
      return;
    }

    const tree = context.get(DATA_CONTEXT_ELEMENTS_TREE);
    const nodes = tree?.isNodeSelected(node.uri)
      ? tree
          .getSelected()
          .map(id => this.navNodeInfoResource.get(id))
          .filter((node): node is NavNode => !!node)
      : [this.navNodeInfoResource.get(node.uri) ?? node];

    await this.delete(nodes);
  }

  async delete(nodes: NavNode[]): Promise<void> {
    if (this.deleting || !nodes.length) {
      return;
    }
    this.deleting = true;
    try {
      nodes = [...new Map(nodes.map(node => [node.uri, node])).values()];
      const contexts = await this.prepareDeletion.execute(nodes);
      if (ExecutorInterrupter.isInterrupted(contexts)) {
        return;
      }
      const plan = contexts.getContext(nodeDeletionPlanContext);
      const { items, rows } = await plan.prepare(this.navNodeInfoResource, this.projectInfoResource);
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

  private async confirm(items: INodeDeletionItem[], rows: INodeDeletionDialogItem[]): Promise<INodeDeletionItem[]> {
    if (!items.length) {
      return [];
    }
    const { status, result } = await this.commonDialogService.open(NodeDeletionDialog, { items: rows });
    if (status !== DialogueStateResult.Resolved || !result?.length) {
      return [];
    }
    const selected = new Set(result);
    return items.filter(item => selected.has(item.node.uri));
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
        errors.set(batch ?? item, `${(batch ?? [item]).map(label).join(', ')}: ${message}${error instanceof Error ? `\n${error.message}` : ''}`);
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
}
