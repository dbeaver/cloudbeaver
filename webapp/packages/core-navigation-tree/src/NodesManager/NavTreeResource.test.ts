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
  return { resource, navDeleteNodes, deleted, markOutdated, data };
}

describe('NavTreeResource deletion', () => {
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
