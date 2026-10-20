/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';

import type { IElementsTreeFilter } from './ElementsTree/useElementsTree.js';

export function navigationTreeNavigableFilter(navNodeInfoResource: NavNodeInfoResource): IElementsTreeFilter {
  return (tree, filter, node, children) => children.filter(child => navNodeInfoResource.get(child)?.navigable !== false);
}
