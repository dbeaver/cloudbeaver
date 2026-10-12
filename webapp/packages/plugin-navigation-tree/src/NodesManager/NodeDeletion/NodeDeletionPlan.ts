/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { NavNode } from '@cloudbeaver/core-navigation-tree';

export interface INodeDeletionTarget {
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

interface INodeDeletionProviderBase {
  /** Identifies nodes owned by this provider. The first matching provider wins. */
  isApplicable: (node: NavNode) => boolean;
  /** Deleting this node preserves its descendants, so excluded or failed descendants do not block it. */
  keepChildren?: boolean;
  /** The owning provider can exclude a node from deletion. Mixed selections still explain the exclusion. */
  isHidden?: (node: NavNode) => boolean;
  /** Checks current deletion permissions without loading confirmation metadata. */
  isDisabled?: (node: NavNode) => boolean;
  /** Confirmation metadata for visible nodes, including disabled nodes. */
  getInfo: (node: NavNode) => Promise<INodeDeletionTarget> | INodeDeletionTarget;
}

/** Supply exactly one strategy. Return false on cancellation; throw on failure. */
export type INodeDeletionProvider = INodeDeletionProviderBase &
  (
    | {
        /** Sequential deletion, including any domain-specific lifecycle guards. */
        deleteNode: (node: NavNode) => Promise<boolean | void>;
        deleteBatch?: never;
      }
    | {
        deleteNode?: never;
        /** Deletes independent nodes together; any domain-specific grouping belongs to the provider. */
        deleteBatch: (nodes: NavNode[]) => Promise<boolean | void>;
      }
  );

export interface INodeDeletionItem {
  /** Explicitly selected node to delete. */
  node: NavNode;
  /** All parent URIs, from the tree root to the immediate parent. */
  parents: string[];
  /** Provider responsible for executing this node's deletion. */
  provider: INodeDeletionProvider;
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
   * Cancelled means the provider returned false; skipped means no request was made because dependencies blocked it.
   */
  status: 'deleted' | 'failed' | 'unknown' | 'cancelled' | 'skipped';
  /** Error thrown by the provider, when deletion failed or its outcome is unknown. */
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
  const isBlocked = (item: INodeDeletionItem) => !item.provider.keepChildren && blocked.has(item.node.uri);
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

/** Deletes children before parents, batches ready nodes by provider, and continues independent work after failures. */
export async function executeNodeDeletionPlan(items: readonly INodeDeletionItem[]): Promise<INodeDeletionResult[]> {
  const results: INodeDeletionResult[] = [];
  const pending = [...items];

  while (pending.length) {
    const pendingParents = getParents(pending);
    const ready = pending.filter(item => !pendingParents.has(item.node.uri));
    if (!ready.length) {
      // Invalid ancestry must never cause destructive operations in an arbitrary order.
      results.push(...pending.map(item => ({ item, status: 'skipped' as const })));
      break;
    }

    while (ready.length) {
      const first = ready[0]!;
      const provider = first.provider;
      const group = provider.deleteBatch ? ready.filter(item => item.provider === provider) : [first];
      const executable: INodeDeletionItem[] = [];
      const blockedParents = getParents(results.filter(result => result.status !== 'deleted').map(result => result.item));

      for (const item of group) {
        ready.splice(ready.indexOf(item), 1);
        pending.splice(pending.indexOf(item), 1);
        const blocked = !item.provider.keepChildren && blockedParents.has(item.node.uri);
        if (blocked) {
          results.push({ item, status: 'skipped' });
        } else {
          executable.push(item);
        }
      }

      if (!executable.length) {
        continue;
      }

      try {
        const deleted = provider.deleteBatch
          ? await provider.deleteBatch(executable.map(item => item.node))
          : await provider.deleteNode(executable[0]!.node);
        results.push(...executable.map(item => ({ item, status: deleted === false ? ('cancelled' as const) : ('deleted' as const) })));
      } catch (error) {
        // A failed backend batch may have partially completed; do not retry destructive requests.
        results.push(
          ...executable.map(item => ({
            item,
            status: provider.deleteBatch ? ('unknown' as const) : ('failed' as const),
            error,
            batch: provider.deleteBatch ? executable : undefined,
          })),
        );
      }
    }
  }

  return results;
}
