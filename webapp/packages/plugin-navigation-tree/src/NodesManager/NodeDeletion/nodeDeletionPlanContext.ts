/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { type NavNode, ROOT_NODE_PATH } from '@cloudbeaver/core-navigation-tree';

import {
  prepareNodeDeletionPlan,
  type INodeDeletionDialogItem,
  type INodeDeletionExclusion,
  type INodeDeletionExcludedTarget,
  type INodeDeletionItem,
  type INodeDeletionOperation,
  type INodeDeletionPlanBuilder,
} from './NodeDeletionPlan.js';

export function nodeDeletionPlanContext(contexts: IExecutionContextProvider<NavNode[]>, nodes: NavNode[]): INodeDeletionPlanBuilder {
  const operations: INodeDeletionOperation[] = [];
  const exclusions: INodeDeletionExcludedTarget[] = [];

  return {
    operations,
    exclusions,
    addOperation(operation) {
      operations.push(operation);
    },
    exclude(target) {
      exclusions.push(target);
    },
    async prepare(navNodeInfoResource, projectInfoResource) {
      this.validateOwnership();
      const targets = new Map(operations.flatMap(operation => operation.targets.map(target => [target.node.uri, { target, operation }] as const)));
      const excluded = new Map(exclusions.map(target => [target.node.uri, target]));
      const items: INodeDeletionItem[] = [];
      const unavailable: INodeDeletionExclusion[] = [];
      const rows = new Map<string, INodeDeletionDialogItem>();
      for (const node of nodes) {
        const contribution = targets.get(node.uri);
        const target = contribution?.target ?? excluded.get(node.uri);
        const parents = await navNodeInfoResource.resolveParents(node.uri);
        if (target?.reason || !contribution) {
          unavailable.push({ node, parents, reason: target?.reason ?? 'plugin_navigation_tree_delete_unavailable' });
        } else {
          items.push({ ...contribution.target, operation: contribution.operation, parents });
        }
        rows.set(node.uri, {
          id: node.uri,
          parents,
          keepChildren: target?.keepChildren,
          name: node.name || node.uri,
          icon: node.icon,
          type: target?.type ?? 'plugin_navigation_tree_delete_object',
          readOnly: target?.readOnly,
          warning: target?.warning,
          project: (node.projectId && projectInfoResource.get(node.projectId)?.name) || node.projectId || '',
          location: parents
            .filter(id => id !== ROOT_NODE_PATH && id !== target?.locationRoot)
            .map(id => navNodeInfoResource.get(id)?.name)
            .filter(Boolean)
            .join('/'),
        });
      }
      const plan = prepareNodeDeletionPlan(items, unavailable);
      for (const exclusion of plan.exclusions) {
        rows.get(exclusion.node.uri)!.reason = exclusion.reason;
      }
      return { items: plan.items, rows: [...rows.values()] };
    },
    validateOwnership() {
      const selected = new Set(nodes.map(node => node.uri));
      const owners = new Map<string, string>();
      const ids = new Set<string>();
      for (const operation of operations) {
        if (ids.has(operation.id)) {
          throw new Error(`Duplicate deletion operation: ${operation.id}`);
        }
        ids.add(operation.id);
      }
      const targets = [...operations.flatMap(operation => operation.targets.map(target => ({ ...target, owner: operation.owner }))), ...exclusions];
      for (const { node, owner } of targets) {
        if (!selected.has(node.uri)) {
          throw new Error(`Deletion target was not selected: ${node.uri}`);
        }
        if (owners.has(node.uri)) {
          throw new Error(`Conflicting deletion owners for ${node.uri}: ${owners.get(node.uri)}, ${owner}`);
        }
        owners.set(node.uri, owner);
      }
    },
  };
}

/** Cached capability checks for menus; handlers own applicability and permissions. */
export function nodeDeletionAvailabilityContext(): Set<string> {
  return new Set();
}
