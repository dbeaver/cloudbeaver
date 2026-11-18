/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test } from 'vitest';

import type { NavNode } from '@cloudbeaver/core-navigation-tree';

import type { IElementsTree } from './ElementsTree/useElementsTree.js';
import type { NavigationTreeService } from './NavigationTreeService.js';
import { navigationTreeVirtualChildrenFilter } from './navigationTreeVirtualChildrenFilter.js';

function createFilter(getVirtualChildren: (node: NavNode) => string[]) {
  return navigationTreeVirtualChildrenFilter({ getVirtualChildren } as unknown as NavigationTreeService);
}

const tree = {} as IElementsTree;
const node = { uri: 'node://project/datasources/connection/folderAdmin' } as NavNode;

describe('navigationTreeVirtualChildrenFilter', () => {
  test('puts virtual children before server children', () => {
    const filter = createFilter(() => ['virtual']);

    expect(filter(tree, '', node, ['real'], new Map() as any)).toEqual(['virtual', 'real']);
  });

  test('keeps children when there are no virtual children', () => {
    const children = ['real'];
    const filter = createFilter(() => []);

    expect(filter(tree, '', node, children, new Map() as any)).toBe(children);
  });

  test('skips virtual children while the tree is filtered by name', () => {
    const filter = createFilter(() => ['virtual']);

    expect(filter(tree, 'orders', node, ['real'], new Map() as any)).toEqual(['real']);
  });
});
