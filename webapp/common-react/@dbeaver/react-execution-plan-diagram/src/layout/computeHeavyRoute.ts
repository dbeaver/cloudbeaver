/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IPlanNode } from '../types/IPlanNode.js';

function getCumulativeCost(node: IPlanNode, cache: Map<string, number>): number {
  const cached = cache.get(node.id);

  if (cached !== undefined) {
    return cached;
  }

  let cost = node.cost ?? 0;

  if (node.children) {
    for (const child of node.children) {
      cost += getCumulativeCost(child, cache);
    }
  }

  cache.set(node.id, cost);
  return cost;
}

function markHeavyRoute(node: IPlanNode, result: Set<string>, cache: Map<string, number>): void {
  result.add(node.id);

  if (!node.children || node.children.length === 0) {
    return;
  }

  let heaviestChild = node.children[0]!;
  let heaviestCost = getCumulativeCost(heaviestChild, cache);

  for (let i = 1; i < node.children.length; i++) {
    const childCost = getCumulativeCost(node.children[i]!, cache);

    if (childCost > heaviestCost) {
      heaviestChild = node.children[i]!;
      heaviestCost = childCost;
    }
  }

  markHeavyRoute(heaviestChild, result, cache);
}

export function computeHeavyRoute(roots: IPlanNode[]): Set<string> {
  const result = new Set<string>();
  const cache = new Map<string, number>();

  for (const root of roots) {
    markHeavyRoute(root, result, cache);
  }

  return result;
}
