/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { NavTreeResource, NavNodeInfoResource, NavNode } from '@cloudbeaver/core-navigation-tree';
import { resourceKeyList } from '@cloudbeaver/core-sdk';
import type { MetadataMap } from '@cloudbeaver/core-utils';

import { EEquality, NavNodeFilterCompareFn } from './NavNodeFilterCompareFn';
import type { IElementsTreeFilter, ITreeNodeState } from './useElementsTree';

function isDefined<T>(val: T | undefined | null): val is T {
  return val !== undefined && val !== null;
}

export function elementsTreeNameFilter(
  navTreeResource: NavTreeResource,
  navNodeInfoResource: NavNodeInfoResource,
  compare: NavNodeFilterCompareFn = elementsTreeNameFilterNode
): IElementsTreeFilter {
  return (tree, filter, node, children, state) => {
    const nodeState = state.get(node.id);

    if (filter === '' || nodeState.showInFilter || compare(node, filter) === EEquality.full) {
      return children;
    }

    const nodes = navNodeInfoResource
      .get(resourceKeyList(children))
      .filter(isDefined)
      .filter(child => filterNode(
        navTreeResource,
        navNodeInfoResource,
        compare,
        filter,
        child,
        state
      ));

    return nodes.map(node => node.id);
  };
}

function filterNode(
  navTreeResource: NavTreeResource,
  navNodeInfoResource: NavNodeInfoResource,
  compare: NavNodeFilterCompareFn,
  filter: string,
  node: NavNode,
  state: MetadataMap<string, ITreeNodeState>
): boolean {
  const nodeState = state.get(node.id);


  if (compare(node, filter) !== EEquality.none || nodeState.showInFilter) {
    return true;
  }

  // if (nodeState.expanded) {
  const children = navTreeResource.get(node.id) || [];

  return navNodeInfoResource
    .get(resourceKeyList(children))
    .filter(isDefined)
    .some(child => filterNode(
      navTreeResource,
      navNodeInfoResource,
      compare,
      filter,
      child,
      state
    ));
  // }

  // return false;
}

export function elementsTreeNameFilterNode(node: NavNode, filter: string): EEquality {
  const nodeName = node.name?.toLowerCase().trim();
  const filterToLower = filter.toLowerCase().trim();

  if (nodeName === filterToLower) {
    return EEquality.full;
  }

  return nodeName?.includes(filterToLower) ? EEquality.partially : EEquality.none;
}
