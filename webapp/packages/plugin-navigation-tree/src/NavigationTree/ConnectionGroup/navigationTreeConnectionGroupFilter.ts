/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ENodeFeature, EObjectFeature, type NavNode, type NavNodeInfoResource, ROOT_NODE_PATH } from '@cloudbeaver/core-navigation-tree';
import { resourceKeyList } from '@cloudbeaver/core-resource';

import type { IElementsTreeFilter } from '../ElementsTree/useElementsTree.js';

export const NAVIGATION_TREE_CONNECTION_GROUPS = {
  unsorted: 'nav-tree://connection-group/unsorted',
  manageable: 'nav-tree://connection-group/manageable',
  unmanageable: 'nav-tree://connection-group/unmanageable',
};

function isDefined<T>(val: T | undefined | null): val is T {
  return val !== undefined && val !== null;
}

function sortManageable(): (nodeA: NavNode, nodeB: NavNode) => number {
  return (nodeA: NavNode, nodeB: NavNode): number => {
    const nodeAShared = nodeA.features?.includes(ENodeFeature.shared);
    const nodeBShared = nodeB.features?.includes(ENodeFeature.shared);

    if (nodeAShared === nodeBShared) {
      const nodeAConnection = nodeA.objectFeatures.includes(EObjectFeature.dataSource);
      const nodeBConnection = nodeB.objectFeatures.includes(EObjectFeature.dataSource);

      if (!nodeAConnection || !nodeBConnection) {
        if (nodeAConnection === nodeBConnection) {
          return 0;
        }
        return nodeAConnection ? 1 : -1;
      }
    }

    return nodeBShared ? -1 : 1;
  };
}

export function navigationTreeConnectionGroupFilter(resource: NavNodeInfoResource): IElementsTreeFilter {
  return (tree, filter, node, children) => {
    if (node.id !== ROOT_NODE_PATH) {
      return children;
    }

    const nodes = resource.get(resourceKeyList(children)).filter(isDefined).sort(sortManageable());

    let groupedChildren: string[] = [];
    let lastGroup = NAVIGATION_TREE_CONNECTION_GROUPS.unsorted;
    let groups = 0;

    for (const node of nodes) {
      const manageable = !node.features?.includes(ENodeFeature.shared);
      let nextGroup = NAVIGATION_TREE_CONNECTION_GROUPS.unsorted;

      if (manageable) {
        nextGroup = NAVIGATION_TREE_CONNECTION_GROUPS.manageable;
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
      groupedChildren = groupedChildren.filter(
        id => id !== NAVIGATION_TREE_CONNECTION_GROUPS.manageable && id !== NAVIGATION_TREE_CONNECTION_GROUPS.unmanageable,
      );
    }

    return groupedChildren;
  };
}
