/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IPlanNode } from '../types/IPlanNode.js';

function findHeaviestChild(children: IPlanNode[]): IPlanNode | undefined {
  let heaviest: IPlanNode | undefined;
  let heaviestCost = -1;

  for (const child of children) {
    const cost = child.cost ?? 0;

    if (cost > heaviestCost) {
      heaviest = child;
      heaviestCost = cost;
    }
  }

  return heaviestCost > 0 ? heaviest : undefined;
}

/**
 * Computes the "heavy route" — the path from each root to a leaf
 * following the most expensive child at each level.
 */
export function computeHeavyRoute(roots: IPlanNode[]): Set<string> {
  const result = new Set<string>();

  for (const root of roots) {
    if (root.cost == null || root.cost <= 0) {
      continue;
    }

    let current: IPlanNode | undefined = root;

    while (current) {
      result.add(current.id);

      if (!current.children || current.children.length === 0) {
        break;
      }

      current = findHeaviestChild(current.children);
    }
  }

  return result;
}
