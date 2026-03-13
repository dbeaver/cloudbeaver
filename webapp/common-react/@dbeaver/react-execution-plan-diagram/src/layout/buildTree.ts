/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IPlanNode } from '../types/IPlanNode.js';

/**
 * Converts a flat node list (using parentId) into a tree structure (using children).
 * If nodes already have children populated, returns them as-is.
 */
export function buildTree(nodes: IPlanNode[]): IPlanNode[] {
  const hasChildren = nodes.some(n => n.children && n.children.length > 0);

  if (hasChildren) {
    return nodes.filter(n => !n.parentId);
  }

  const map = new Map<string, IPlanNode>();
  const tree: IPlanNode[] = [];

  for (const node of nodes) {
    map.set(node.id, { ...node, children: [] });
  }

  for (const node of nodes) {
    const treeNode = map.get(node.id)!;
    const parent = node.parentId ? map.get(node.parentId) : undefined;

    if (parent) {
      parent.children!.push(treeNode);
    } else {
      tree.push(treeNode);
    }
  }

  return tree;
}

export function flattenTree(roots: IPlanNode[]): IPlanNode[] {
  const result: IPlanNode[] = [];

  function collectAll(node: IPlanNode): void {
    result.push(node);

    if (node.children) {
      for (const child of node.children) {
        collectAll(child);
      }
    }
  }

  for (const root of roots) {
    collectAll(root);
  }

  return result;
}

export function filterVisibleNodes(roots: IPlanNode[], collapsedNodes: Set<string>): IPlanNode[] {
  const result: IPlanNode[] = [];

  function collectVisible(node: IPlanNode): void {
    result.push(node);

    if (collapsedNodes.has(node.id) || !node.children) {
      return;
    }

    for (const child of node.children) {
      collectVisible(child);
    }
  }

  for (const root of roots) {
    collectVisible(root);
  }

  return result;
}
