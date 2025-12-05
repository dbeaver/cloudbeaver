/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { NavTreeResource } from '@cloudbeaver/core-navigation-tree';
import type { IElementsTreeFilter } from '../useElementsTree.js';
import { hasMorePagesForResourceKey } from '@cloudbeaver/core-resource';

export const NAVIGATION_TREE_LIMIT = {
  limit: 'nav-tree://limit',
};

export function elementsTreeLimitFilter(navTreeResource: NavTreeResource): IElementsTreeFilter {
  return (tree, filter, node, children) => {
    if (hasMorePagesForResourceKey(navTreeResource, node.id)) {
      return [...children, NAVIGATION_TREE_LIMIT.limit];
    }

    return children;
  };
}
