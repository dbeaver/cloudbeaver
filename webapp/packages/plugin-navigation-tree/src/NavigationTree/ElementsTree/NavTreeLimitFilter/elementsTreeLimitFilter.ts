/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { NavTreeResource } from '@cloudbeaver/core-navigation-tree';

import type { IElementsTreeFilter } from '../useElementsTree';

export const NAVIGATION_TREE_LIMIT = {
  limit: 'nav-tree://limit',
};

export function elementsTreeLimitFilter(
  navTreeResource: NavTreeResource,
  limit?: number
): IElementsTreeFilter {
  return (tree, filter, node, children) => {
    limit = limit ?? navTreeResource.childrenLimit;
    const nextChildren = children.slice(0, limit);

    if (children.length > limit) {
      nextChildren.push(NAVIGATION_TREE_LIMIT.limit);
    }

    return nextChildren;
  };
}
