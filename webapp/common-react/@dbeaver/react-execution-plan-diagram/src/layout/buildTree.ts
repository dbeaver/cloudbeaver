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

    if (node.parentId) {
      const parent = map.get(node.parentId);
      parent?.children!.push(treeNode);
    } else {
      tree.push(treeNode);
    }
  }

  return tree;
}

export function flattenTree(roots: IPlanNode[]): IPlanNode[] {
  const result: IPlanNode[] = [];

  function walk(node: IPlanNode): void {
    result.push(node);

    if (node.children) {
      for (const child of node.children) {
        walk(child);
      }
    }
  }

  for (const root of roots) {
    walk(root);
  }

  return result;
}

export function filterVisibleNodes(allNodes: IPlanNode[], collapsedNodes: Set<string>): IPlanNode[] {
  if (collapsedNodes.size === 0) {
    return allNodes;
  }

  const parentMap = new Map(allNodes.map(n => [n.id, n.parentId]));
  const hiddenCache = new Map<string, boolean>();

  function isHidden(nodeId: string): boolean {
    const cached = hiddenCache.get(nodeId);

    if (cached !== undefined) {
      return cached;
    }

    const parentId = parentMap.get(nodeId);

    if (!parentId) {
      hiddenCache.set(nodeId, false);
      return false;
    }

    const result = collapsedNodes.has(parentId) || isHidden(parentId);
    hiddenCache.set(nodeId, result);
    return result;
  }

  return allNodes.filter(n => !isHidden(n.id));
}
