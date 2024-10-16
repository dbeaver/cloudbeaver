/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { NavNode } from '@cloudbeaver/core-navigation-tree';

import type { IElementsTree } from './useElementsTree.js';

export enum EEquality {
  none,
  partially,
  full,
}

export type NavNodeFilterCompareFn = (tree: IElementsTree, node: NavNode, filter: string) => EEquality;
