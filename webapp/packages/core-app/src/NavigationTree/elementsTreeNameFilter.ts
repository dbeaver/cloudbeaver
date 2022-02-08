/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { resourceKeyList } from '@cloudbeaver/core-sdk';
import type { MetadataMap } from '@cloudbeaver/core-utils';

import type { NavNode } from '../shared/NodesManager/EntityTypes';
import type { NavNodeInfoResource } from '../shared/NodesManager/NavNodeInfoResource';
import type { NavTreeResource } from '../shared/NodesManager/NavTreeResource';
import type { IElementsTreeFilter, ITreeNodeState } from './useElementsTree';

export type NavNodeFilterCompareFn = (node: NavNode, filter: string)=> boolean;

function isDefined<T>(val: T | undefined | null): val is T {
  return val !== undefined && val !== null;
}

export function elementsTreeNameFilter(
  navTreeResource: NavTreeResource,
  navNodeInfoResource: NavNodeInfoResource,
  compare: NavNodeFilterCompareFn = compareNodes
): IElementsTreeFilter {
  return (filter: string, node: NavNode, children: string[], state: MetadataMap<string, ITreeNodeState>) => {
    if (filter === '' || compare(node, filter)) {
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
        // state
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
  // state: MetadataMap<string, ITreeNodeState>
): boolean {
  // const nodeState = state.get(node.id);
  
  
  if (compare(node, filter)) {
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
      // state
    ));
  // }
  
  // return false;
}

function compareNodes(node: NavNode, filter: string): boolean {
  return node.name?.toLowerCase().includes(filter.toLowerCase()) ?? false;
}
