/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { resourceKeyList } from '@cloudbeaver/core-sdk';
import type { MetadataMap } from '@cloudbeaver/core-utils';

import type { NavNode } from '../shared/NodesManager/EntityTypes';
import type { NavNodeInfoResource } from '../shared/NodesManager/NavNodeInfoResource';
import type { IElementsTreeFilter, ITreeNodeState } from './useElementsTree';

function isDefined<T>(val: T | undefined | null): val is T {
  return val !== undefined && val !== null;
}

export function elementsTreeNameFilter(resource: NavNodeInfoResource): IElementsTreeFilter {
  return (node: NavNode, children: string[], state: MetadataMap<string, ITreeNodeState>) => {
    const nodeState = state.get(node.id);

    if (nodeState.filter === '') {
      return children;
    }

    const nodes = resource
      .get(resourceKeyList(children))
      .filter(isDefined)
      .filter(child => child.name?.toLowerCase().includes(nodeState.filter.toLowerCase()));

    return nodes.map(node => node.id);
  };
}
