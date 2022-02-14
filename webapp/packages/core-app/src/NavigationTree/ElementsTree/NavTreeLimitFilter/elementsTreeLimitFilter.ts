/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { NavNode } from '../../../shared/NodesManager/EntityTypes';
import type { NavTreeResource } from '../../../shared/NodesManager/NavTreeResource';
import type { IElementsTreeFilter } from '../useElementsTree';

export const NAVIGATION_TREE_LIMIT = {
  limit: 'nav-tree://limit',
};

export function elementsTreeLimitFilter(
  navTreeResource: NavTreeResource,
  limit?: number
): IElementsTreeFilter {
  return (
    filter: string,
    node: NavNode,
    children: string[],
  ) => {
    limit = limit ?? navTreeResource.childrenLimit;
    const nextChildren = children.slice(0, limit);

    if (children.length > limit) {
      nextChildren.push(NAVIGATION_TREE_LIMIT.limit);
    }

    return nextChildren;
  };
}
