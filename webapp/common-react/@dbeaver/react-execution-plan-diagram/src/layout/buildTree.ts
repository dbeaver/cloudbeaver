/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IPlanNode } from '../types/IPlanNode.js';

export interface IPlanTreeData {
  roots: IPlanNode[];
  nodeMap: Map<string, IPlanNode>;
}

/**
 * Converts a flat node list (using parentId) into a tree structure (using children).
 * If nodes already have children populated, extracts roots from the list.
 */
export function buildTree(nodes: IPlanNode[]): IPlanTreeData {
  const hasChildren = nodes.some(n => n.children && n.children.length > 0);

  if (hasChildren) {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const roots = nodes.filter(n => !n.parentId);
    return { roots, nodeMap };
  }

  const nodeMap = new Map<string, IPlanNode>();
  const roots: IPlanNode[] = [];

  for (const node of nodes) {
    nodeMap.set(node.id, { ...node, children: [] });
  }

  for (const node of nodes) {
    const treeNode = nodeMap.get(node.id)!;
    const parent = node.parentId ? nodeMap.get(node.parentId) : undefined;

    if (parent) {
      parent.children!.push(treeNode);
    } else {
      roots.push(treeNode);
    }
  }

  return { roots, nodeMap };
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
