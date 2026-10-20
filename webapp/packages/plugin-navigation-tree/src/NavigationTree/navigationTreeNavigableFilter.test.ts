/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test, vi } from 'vitest';

import type { NavNode, NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';

import type { IElementsTreeFilter } from './ElementsTree/useElementsTree.js';
import { navigationTreeNavigableFilter } from './navigationTreeNavigableFilter.js';

describe('navigationTreeNavigableFilter', () => {
  const profile = { uri: 'profile', navigable: true } as NavNode;
  const users = { uri: 'users', navigable: false } as NavNode;
  const resource = { uri: 'resource', navigable: true } as NavNode;

  function filterChildren(children: string[], nodes: NavNode[]) {
    const nodeMap = new Map(nodes.map(node => [node.uri, node]));
    const navNodeInfoResource = { get: vi.fn((id: string) => nodeMap.get(id)) } as unknown as NavNodeInfoResource;
    const filter = navigationTreeNavigableFilter(navNodeInfoResource);

    return filter({} as Parameters<IElementsTreeFilter>[0], '', profile, children, {} as Parameters<IElementsTreeFilter>[4]);
  }

  test('hides non-navigable profile users while retaining resources', () => {
    expect(filterChildren(['users', 'resource'], [users, resource])).toEqual(['resource']);
  });

  test('keeps navigable users folders', () => {
    expect(filterChildren(['users', 'resource'], [{ ...users, navigable: true }, resource])).toEqual(['users', 'resource']);
  });

  test('keeps nodes whose metadata has not loaded', () => {
    expect(filterChildren(['pending', 'resource'], [resource])).toEqual(['pending', 'resource']);
  });

  test('preserves cached children and metadata for object editors', () => {
    const children = ['users', 'resource'];

    filterChildren(children, [users, resource]);

    expect(children).toEqual(['users', 'resource']);
    expect(users.navigable).toBe(false);
  });
});
