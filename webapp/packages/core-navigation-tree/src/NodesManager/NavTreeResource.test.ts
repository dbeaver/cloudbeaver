/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vi } from 'vitest';

import { resourceKeyList } from '@cloudbeaver/core-resource';

import { NavTreeResource } from './NavTreeResource.js';

function setup() {
  const nodes = new Map([
    ['a', { parentId: 'parent' }],
    ['b', { parentId: 'parent' }],
  ]);
  const data = new Map([['parent', ['a', 'b', 'unselected']]]);
  const navDeleteNodes = vi.fn().mockResolvedValue({ navDeleteNodes: true });
  const deleted: string[] = [];
  const markOutdated = vi.fn();
  // Exercise the resource's deletion/cache coordination without starting authentication or a server.
  const resource: NavTreeResource = Object.assign(Object.create(NavTreeResource.prototype), {
    graphQLService: { sdk: { navDeleteNodes } },
    navNodeInfoResource: { get: (key: string) => nodes.get(key) },
    performUpdate: (_key: unknown, _includes: unknown, action: () => Promise<void>) => action(),
    data,
    dataSet: (key: string, value: string[]) => data.set(key, value),
    delete: (keys: string[]) => deleted.push(...keys),
    markOutdated,
    onDataOutdated: { execute: vi.fn() },
    onItemUpdate: { execute: vi.fn() },
  });
  return { resource, navDeleteNodes, deleted, markOutdated, data, nodes };
}

describe('NavTreeResource deletion', () => {
  it.each([false, true])('does not leave a deleted nested folder in its parent (with sibling: %s)', async withSibling => {
    const { resource, navDeleteNodes, deleted, markOutdated, data, nodes } = setup();
    const parent = 'node://project/datasources/Regression/New folder';
    const child = `${parent}/New folder`;
    const sibling = `${parent}/Other folder`;
    const remaining = withSibling ? [sibling] : [];
    const serverNodes = new Set([child, ...remaining]);
    nodes.set(child, { parentId: parent });
    data.set(parent, [child, ...remaining]);
    navDeleteNodes.mockImplementation(({ nodePaths }: { nodePaths: string[] }) => {
      nodePaths.forEach(path => serverNodes.delete(path));
      return Promise.resolve({ navDeleteNodes: nodePaths.length });
    });

    const reloadVisibleChildren = () => {
      for (const path of data.get(parent) ?? []) {
        if (!serverNodes.has(path)) {
          throw new Error(`Node '${path}' not found`);
        }
      }
    };
    // Parent invalidation can synchronously notify consumers that use its cached children.
    markOutdated.mockImplementation(reloadVisibleChildren);

    await expect(resource.deleteNode(child)).resolves.toBeUndefined();

    expect(reloadVisibleChildren).not.toThrow();
    expect(data.get(parent)).toEqual(remaining);
    expect(deleted).toEqual([child]);
  });

  it('sends one batch and removes the deleted nodes from the cache', async () => {
    const { resource, navDeleteNodes, deleted } = setup();

    await resource.deleteNode(resourceKeyList(['a', 'b']));

    expect(navDeleteNodes).toHaveBeenCalledExactlyOnceWith({ nodePaths: ['a', 'b'] });
    expect(deleted).toEqual(['a', 'b']);
  });

  it('invalidates parents after a failed batch without guessing which children were deleted', async () => {
    const { resource, navDeleteNodes, deleted, markOutdated, data } = setup();
    navDeleteNodes.mockRejectedValue(new Error('Batch failed'));

    await expect(resource.deleteNode(resourceKeyList(['a', 'b']))).rejects.toThrow('Batch failed');

    expect(navDeleteNodes).toHaveBeenCalledTimes(1);
    expect(markOutdated).toHaveBeenCalledWith(resourceKeyList(['parent', 'parent']));
    expect(data.get('parent')).toEqual(['a', 'b', 'unselected']);
    expect(deleted).toEqual([]);
  });

  it('does not issue a destructive request for an empty collection', async () => {
    const { resource, navDeleteNodes } = setup();

    await resource.deleteNode(resourceKeyList([]));

    expect(navDeleteNodes).not.toHaveBeenCalled();
  });
});
