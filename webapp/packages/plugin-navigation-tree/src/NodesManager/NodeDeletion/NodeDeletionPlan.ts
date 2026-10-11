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
  reason?: string;
  warning?: string;
  /** Technical root node omitted from the displayed location. */
  locationRoot?: string;
  /** Only targets with the same batch key and no dependencies are passed together. */
  batchKey?: string;
}

export interface INodeDeletionProvider {
  isApplicable: (node: NavNode) => boolean;
  /** Exclude the node from confirmation and deletion, including mixed selections. */
  isHidden?: (node: NavNode) => boolean;
  isDisabled?: (node: NavNode) => boolean;
  getInfo: (node: NavNode) => Promise<INodeDeletionTarget> | INodeDeletionTarget;
  /** Return false when lifecycle guards cancel deletion. Throw on failure. */
  handler: (nodes: NavNode[]) => Promise<boolean | void>;
}

export interface INodeDeletionItem extends INodeDeletionTarget {
  node: NavNode;
  project: string;
  location: string;
  ancestors: string[];
  provider?: INodeDeletionProvider;
}

export interface INodeDeletionResult {
  item: INodeDeletionItem;
  status: 'deleted' | 'failed' | 'cancelled' | 'skipped';
  error?: unknown;
}

/** Visual ancestry orders operations; it never implies recursive deletion. */
export async function executeNodeDeletionPlan(items: readonly INodeDeletionItem[]): Promise<INodeDeletionResult[]> {
  const results: INodeDeletionResult[] = [];
  const pending = items.filter(item => {
    if (item.reason || !item.provider) {
      results.push({ item, status: 'skipped' });
      return false;
    }
    return true;
  });

  while (pending.length) {
    const pendingAncestors = new Set(pending.flatMap(item => item.ancestors));
    const ready = pending.filter(item => !pendingAncestors.has(item.node.uri));
    if (!ready.length) {
      // Invalid ancestry must never cause destructive operations in an arbitrary order.
      results.push(...pending.map(item => ({ item, status: 'skipped' as const })));
      break;
    }

    while (ready.length) {
      const first = ready[0]!;
      const group = ready.filter(
        item => item === first || (first.batchKey !== undefined && item.batchKey === first.batchKey && item.provider === first.provider),
      );
      const executable: INodeDeletionItem[] = [];
      const blockedAncestors = new Set(results.filter(result => result.status !== 'deleted').flatMap(result => result.item.ancestors));

      for (const item of group) {
        ready.splice(ready.indexOf(item), 1);
        pending.splice(pending.indexOf(item), 1);
        const blocked = blockedAncestors.has(item.node.uri);
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
        const deleted = await first.provider!.handler(executable.map(item => item.node));
        results.push(...executable.map(item => ({ item, status: deleted === false ? ('cancelled' as const) : ('deleted' as const) })));
      } catch (error) {
        // A failed backend batch may have partially completed; do not retry destructive requests.
        results.push(...executable.map(item => ({ item, status: 'failed' as const, error })));
      }
    }
  }

  return results;
}
