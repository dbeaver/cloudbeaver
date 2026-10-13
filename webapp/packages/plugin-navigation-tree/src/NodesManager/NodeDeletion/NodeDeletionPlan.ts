/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { NavNode, NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import type { ProjectInfoResource } from '@cloudbeaver/core-projects';

export interface INodeDeletionTarget {
  node: NavNode;
  /** Deleting configuration preserves descendants rather than deleting their contents. */
  keepChildren?: boolean;
  /** Localization token describing the operation, rather than the tree renderer. */
  type: string;
  /** Shows the readonly indicator; deletion availability is checked separately. */
  readOnly?: boolean;
  /** Localization token explaining why this node cannot be deleted. */
  reason?: string;
  /** Localization token for a warning shown while this node is selected. */
  warning?: string;
  /** Technical root node omitted from the displayed location. */
  locationRoot?: string;
}

export interface INodeDeletionOperation {
  id: string;
  owner: string;
  targets: INodeDeletionTarget[];
  /** Only execute the ready, confirmed subset. Preparation must not mutate resources or open dialogs. */
  execute: (targetIds: string[]) => Promise<INodeDeletionOutcome[]>;
}

export interface INodeDeletionOutcome {
  targetId: string;
  status: 'deleted' | 'failed' | 'unknown' | 'cancelled';
  error?: unknown;
}

export interface INodeDeletionPlanBuilder {
  readonly operations: readonly INodeDeletionOperation[];
  readonly exclusions: readonly INodeDeletionExcludedTarget[];
  addOperation(operation: INodeDeletionOperation): void;
  exclude(target: INodeDeletionExcludedTarget): void;
  validateOwnership(): void;
  prepare(navNodeInfoResource: NavNodeInfoResource, projectInfoResource: ProjectInfoResource): Promise<INodeDeletionPlan>;
}

export interface INodeDeletionPlan {
  items: INodeDeletionItem[];
  rows: INodeDeletionDialogItem[];
}

export interface INodeDeletionExcludedTarget extends Partial<Omit<INodeDeletionTarget, 'node'>> {
  owner: string;
  node: NavNode;
  reason: string;
}

export interface INodeDeletionDialogItem {
  id: string;
  name: string;
  icon?: string;
  type: string;
  readOnly?: boolean;
  project: string;
  location: string;
  warning?: string;
  reason?: string;
  parents?: string[];
  keepChildren?: boolean;
}

export interface INodeDeletionItem extends INodeDeletionTarget {
  /** Explicitly selected node to delete. */
  node: NavNode;
  /** All parent URIs, from the tree root to the immediate parent. */
  parents: string[];
  operation: INodeDeletionOperation;
}

export interface INodeDeletionExclusion {
  /** Selected node excluded from execution. */
  node: NavNode;
  /** All parent URIs, used to protect this node from deletion through a parent. */
  parents: string[];
  /** Localization token explaining the exclusion in confirmation. */
  reason: string;
}

export interface INodeDeletionResult {
  /** Planned deletion described by this result. */
  item: INodeDeletionItem;
  /**
   * Deleted confirms success; failed means a single-node error; unknown means a batch may have partially completed.
   * Cancelled means a lifecycle guard stopped deletion; skipped means dependencies blocked it.
   */
  status: 'deleted' | 'failed' | 'unknown' | 'cancelled' | 'skipped';
  /** Error returned or thrown by the operation. */
  error?: unknown;
  /** Shared identity for reporting a partially completed batch once, without guessing individual outcomes. */
  batch?: readonly INodeDeletionItem[];
}

/** Collects unique parent URIs without deciding whether those parents may be deleted. */
function getParents(items: ReadonlyArray<{ parents: string[] }>): Set<string> {
  return new Set(items.flatMap(item => item.parents));
}

/** Excludes destructive parents of unavailable or unchecked nodes, before and after confirmation. */
export function prepareNodeDeletionPlan(
  items: readonly INodeDeletionItem[],
  exclusions: readonly INodeDeletionExclusion[],
): { items: INodeDeletionItem[]; exclusions: INodeDeletionExclusion[] } {
  const blocked = getParents(exclusions);
  const isBlocked = (item: INodeDeletionItem) => !item.keepChildren && blocked.has(item.node.uri);
  return {
    items: items.filter(item => !isBlocked(item)),
    exclusions: [
      ...exclusions,
      ...items.filter(isBlocked).map(item => ({
        node: item.node,
        parents: item.parents,
        reason: 'plugin_navigation_tree_delete_dependent_unavailable',
      })),
    ],
  };
}

/** Deletes children before parents and continues independent operations after failures. */
export async function executeNodeDeletionPlan(items: readonly INodeDeletionItem[]): Promise<INodeDeletionResult[]> {
  const results: INodeDeletionResult[] = [];
  let pending = [...items];

  while (pending.length) {
    const pendingParents = getParents(pending);
    const ready = pending.filter(item => !pendingParents.has(item.node.uri));
    if (!ready.length) {
      // Invalid ancestry must never cause destructive operations in an arbitrary order.
      results.push(...pending.map(item => ({ item, status: 'skipped' as const })));
      break;
    }

    pending = pending.filter(item => pendingParents.has(item.node.uri));
    // Ready nodes are independent, so their outcomes can only block a later round.
    const blockedParents = getParents(results.filter(result => result.status !== 'deleted').map(result => result.item));
    const handled = new Set<INodeDeletionOperation>();
    for (const first of ready) {
      const operation = first.operation;
      if (handled.has(operation)) {
        continue;
      }
      handled.add(operation);
      const group = ready.filter(item => item.operation === operation);
      const executable: INodeDeletionItem[] = [];

      for (const item of group) {
        const blocked = !item.keepChildren && blockedParents.has(item.node.uri);
        if (blocked) {
          results.push({ item, status: 'skipped' });
        } else {
          executable.push(item);
        }
      }

      if (!executable.length) {
        continue;
      }

      results.push(...(await deleteItems(operation, executable)));
    }
  }

  return results;
}

/** Never retry a possibly partially completed operation or infer success for missing outcomes. */
async function deleteItems(operation: INodeDeletionOperation, items: INodeDeletionItem[]): Promise<INodeDeletionResult[]> {
  try {
    const outcomes = await operation.execute(items.map(item => item.node.uri));
    return items.map(item => {
      const matches = outcomes.filter(outcome => outcome.targetId === item.node.uri);
      const outcome = matches.length === 1 ? matches[0] : undefined;
      return { item, status: outcome?.status ?? 'unknown', error: outcome?.error };
    });
  } catch (error) {
    return items.map(item => ({
      item,
      status: items.length > 1 ? 'unknown' : 'failed',
      error,
      batch: items.length > 1 ? items : undefined,
    }));
  }
}
