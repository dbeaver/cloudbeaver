/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { NavNode, NavNodeInfoResource, NavTreeResource } from '@cloudbeaver/core-navigation-tree';
import { resourceKeyList } from '@cloudbeaver/core-resource';
import type { MetadataMap } from '@cloudbeaver/core-utils';

import { EEquality, type NavNodeFilterCompareFn } from './NavNodeFilterCompareFn.js';
import type { IElementsTree, IElementsTreeFilter, ITreeNodeState } from './useElementsTree.js';

function isDefined<T>(val: T | undefined | null): val is T {
  return val !== undefined && val !== null;
}

export function elementsTreeNameFilter(
  navTreeResource: NavTreeResource,
  navNodeInfoResource: NavNodeInfoResource,
  compare: NavNodeFilterCompareFn = elementsTreeNameFilterNode,
): IElementsTreeFilter {
  return (tree, filter, node, children, state) => {
    const nodeState = state.get(node.id);

    if (filter === '' || nodeState.showInFilter || compare(tree, node, filter) === EEquality.full) {
      return children;
    }

    const nodes = navNodeInfoResource
      .get(resourceKeyList(children))
      .filter(isDefined)
      .filter(child => filterNode(tree, navTreeResource, navNodeInfoResource, compare, filter, child, state));

    return nodes.map(node => node.id);
  };
}

function filterNode(
  tree: IElementsTree,
  navTreeResource: NavTreeResource,
  navNodeInfoResource: NavNodeInfoResource,
  compare: NavNodeFilterCompareFn,
  filter: string,
  node: NavNode,
  state: MetadataMap<string, ITreeNodeState>,
): boolean {
  const nodeState = state.get(node.id);

  if (compare(tree, node, filter) !== EEquality.none || nodeState.showInFilter) {
    return true;
  }

  // if (nodeState.expanded) {
  const children = navTreeResource.get(node.id) || [];

  return navNodeInfoResource
    .get(resourceKeyList(children))
    .filter(isDefined)
    .some(child => filterNode(tree, navTreeResource, navNodeInfoResource, compare, filter, child, state));
  // }

  // return false;
}

export function elementsTreeNameFilterNode(tree: IElementsTree, node: NavNode, filter: string): EEquality {
  const nodeInfo = tree.getTransformedNodeInfo(node);
  const nodeName = nodeInfo.name?.toLowerCase().trim();
  const filterToLower = filter.toLowerCase().trim();

  if (nodeName === filterToLower) {
    return EEquality.full;
  }

  return createFilter(filterToLower)(nodeName) ? EEquality.partially : EEquality.none;
}

function wildcardMatch(value: string, pattern: string): boolean {
  const s = value.toLowerCase();
  const p = pattern.trim().toLowerCase();
  const parts = p.split('*');

  if (parts.length === 1) {
    return s.includes(parts[0]!);
  }

  let pos = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) {
      continue;
    }

    const idx = s.indexOf(part, pos);
    if (idx === -1) {
      return false;
    }

    if (i === 0 && !p.startsWith('*') && idx !== 0) {
      return false;
    }

    pos = idx + part.length;
  }

  if (!p.endsWith('*') && parts[parts.length - 1]) {
    if (!s.endsWith(parts[parts.length - 1]!)) {
      return false;
    }
  }

  return true;
}

function matchesFilter(value: string, filter: string): boolean {
  const groups = filter
    .split(',')
    .map(g => g.trim())
    .filter(Boolean);

  if (!groups.length) {
    return true;
  }

  return groups.every(group => {
    const alts = group
      .split('|')
      .map(a => a.trim())
      .filter(Boolean);

    return alts.some(alt => wildcardMatch(value, alt));
  });
}

function createFilter(filter: string): (value: string) => boolean {
  return (value: string) => matchesFilter(value, filter);
}
