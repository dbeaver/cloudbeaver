/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { NavTreeResource } from '@cloudbeaver/core-navigation-tree';
import { CachedResourceOffsetPageKey } from '@cloudbeaver/core-resource';

import type { IElementsTreeFilter } from '../useElementsTree';

export const NAVIGATION_TREE_LIMIT = {
  limit: 'nav-tree://limit',
};

export function elementsTreeLimitFilter(navTreeResource: NavTreeResource): IElementsTreeFilter {
  return (tree, filter, node, children) => {
    const pageInfo = navTreeResource.offsetPagination.getPageInfo(CachedResourceOffsetPageKey(0, 0).setTarget(node.id));

    if (pageInfo && pageInfo.end === undefined) {
      return [...children, NAVIGATION_TREE_LIMIT.limit];
    }

    return children;
  };
}
