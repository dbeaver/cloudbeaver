/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionInfoResource, EConnectionFeature } from '@cloudbeaver/core-connections';
import { resourceKeyList } from '@cloudbeaver/core-sdk';

import type { NavNode } from '../../shared/NodesManager/EntityTypes';
import { EObjectFeature } from '../../shared/NodesManager/EObjectFeature';
import { NavNodeInfoResource, ROOT_NODE_PATH } from '../../shared/NodesManager/NavNodeInfoResource';
import type { IElementsTreeFilter } from '../ElementsTree/useElementsTree';

export const NAVIGATION_TREE_CONNECTION_GROUPS = {
  unsorted: 'nav-tree://connection-group/unsorted',
  manageable: 'nav-tree://connection-group/manageable',
  unmanageable: 'nav-tree://connection-group/unmanageable',
};

function isDefined<T>(val: T | undefined | null): val is T {
  return val !== undefined && val !== null;
}

function sortManageable(connectionInfoResource: ConnectionInfoResource): (nodeA: NavNode, nodeB: NavNode) => number {
  return (nodeA: NavNode, nodeB: NavNode): number => {
    const nodeAConnection = nodeA.objectFeatures.includes(EObjectFeature.dataSource);
    const nodeBConnection = nodeB.objectFeatures.includes(EObjectFeature.dataSource);

    if (!nodeAConnection || !nodeBConnection) {
      if (nodeAConnection === nodeBConnection) {
        return 0;
      }
      return nodeAConnection ? 1 : -1;
    }

    const connectionA = connectionInfoResource.getConnectionForNode(nodeA.id);
    const connectionB = connectionInfoResource.getConnectionForNode(nodeB.id);

    if (!connectionA || !connectionB) {
      if (connectionA === connectionB) {
        return 0;
      }
      return connectionA ? 1 : -1;
    }

    const nodeAManageable = connectionA.features.includes(EConnectionFeature.manageable);
    const nodeBManageable = connectionB.features.includes(EConnectionFeature.manageable);

    if (nodeAManageable === nodeBManageable) {
      return 0;
    }

    return nodeBManageable ? 1 : -1;
  };
}

export function navigationTreeConnectionGroupFilter(
  connectionInfoResource: ConnectionInfoResource,
  resource: NavNodeInfoResource
): IElementsTreeFilter {
  return (filter: string, node: NavNode, children: string[]) => {
    if (node.id !== ROOT_NODE_PATH) {
      return children;
    }

    const nodes = resource
      .get(resourceKeyList(children))
      .filter(isDefined)
      .sort(sortManageable(connectionInfoResource));

    let groupedChildren: string[] = [];
    let lastGroup = NAVIGATION_TREE_CONNECTION_GROUPS.unsorted;
    let groups = 0;

    for (const node of nodes) {
      const connection = connectionInfoResource.getConnectionForNode(node.id);
      const manageable = !!connection?.features.includes(EConnectionFeature.manageable);

      let nextGroup = NAVIGATION_TREE_CONNECTION_GROUPS.unsorted;

      if (manageable) {
        nextGroup = NAVIGATION_TREE_CONNECTION_GROUPS.manageable;
      } else if (connection) {
        nextGroup = NAVIGATION_TREE_CONNECTION_GROUPS.unmanageable;
      }

      if (nextGroup !== lastGroup) {
        if (nextGroup === NAVIGATION_TREE_CONNECTION_GROUPS.manageable) {
          groupedChildren.push(NAVIGATION_TREE_CONNECTION_GROUPS.manageable);
        } else {
          groupedChildren.push(NAVIGATION_TREE_CONNECTION_GROUPS.unmanageable);
        }
        groups++;
        lastGroup = nextGroup;
      }

      groupedChildren.push(node.id);
    }

    if (groups === 1) {
      groupedChildren = groupedChildren.filter(id =>
        id !== NAVIGATION_TREE_CONNECTION_GROUPS.manageable
        && id !== NAVIGATION_TREE_CONNECTION_GROUPS.unmanageable
      );
    }

    return groupedChildren;
  };
}
