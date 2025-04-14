/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { beforeEach, describe, expect, vitest, test } from 'vitest';

import type { ResourceKey } from '../ResourceKey.js';
import { resourceKeyList } from '../ResourceKeyList.js';
import { CachedTreeChildrenKey, CachedTreeResource, CachedTreeRootChildrenKey } from './CachedTreeResource.js';

interface IMockDataEntity {
  name: string;
}

class TestTreeResource extends CachedTreeResource<IMockDataEntity> {
  constructor() {
    super();
  }

  protected async loader(key: ResourceKey<string>) {
    return this.data;
  }

  protected override validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}

describe('CachedMapResource', () => {
  let treeResource: TestTreeResource;

  beforeEach(() => {
    treeResource = new TestTreeResource();
  });

  test('should instantiate correctly', () => {
    expect(treeResource).toBeInstanceOf(CachedTreeResource);
  });

  test('should set data correctly', () => {
    treeResource.set('root', { name: 'root' });
    expect(treeResource.get('root')).toEqual({ name: 'root' });
  });

  test('.has should check if node exists correctly', () => {
    treeResource.set('root', { name: 'root' });
    treeResource.set('root/level2', { name: 'level2' });

    expect(treeResource.has('root/level2')).toBe(true);
    expect(treeResource.has('root/level3')).toBe(false);
  });

  test('the node should be outdated after markOutdated is called on it', () => {
    treeResource.set('root', { name: 'root' });
    treeResource.set('root/level2', { name: 'level2' });
    treeResource.markOutdated('root');

    expect(treeResource.isOutdated('root')).toBe(true);
    expect(treeResource.isOutdated('root/level2')).toBe(false);
  });

  test('children outdated if parent outdated', () => {
    treeResource.set('root', { name: 'root' });
    treeResource.set('root/level2', { name: 'level2' });
    treeResource.markOutdated('root');

    expect(treeResource.isOutdated('root')).toBe(true);
    expect(treeResource.isOutdated('root/level2')).toBe(false);
  });

  test('should run onDataOutdated handlers on data outdate', () => {
    const handler = vitest.fn();
    treeResource.set('root', { name: 'root' });
    treeResource.set('root/level2', { name: 'level2' });

    treeResource.onDataOutdated.addHandler(key => {
      handler();
      expect(key).toBe('root');
    });

    treeResource.markOutdated('root');

    expect(treeResource.isOutdated('root')).toBe(true);
    expect(handler).toHaveBeenCalled();
  });

  test('CachedTreeChildrenKey alias should return key children of the node', () => {
    const handler = vitest.fn();

    treeResource.set('root', { name: 'root' });
    treeResource.set('root/level2', { name: 'level2' });
    treeResource.set('root/level2/level3', { name: 'level3' });

    treeResource.onDataOutdated.addHandler(key => {
      handler();
      expect(key).toEqual(resourceKeyList(['root/level2']));
    });

    treeResource.markOutdated(CachedTreeChildrenKey('root'));

    expect(handler).toHaveBeenCalled();
  });

  test('CachedTreeRootChildrenKey alias should return children for the root node', () => {
    treeResource.set('root', { name: 'root' });
    treeResource.set('root/level2', { name: 'level2' });
    treeResource.set('root/level2/level3', { name: 'level3' });

    expect(treeResource.get(CachedTreeRootChildrenKey)).toEqual([{ name: 'root' }]);
  });

  test('should be able to delete the node', () => {
    treeResource.set('root', { name: 'root' });
    treeResource.set('root/level2', { name: 'level2' });

    treeResource.delete('root/level2');

    expect(treeResource.has('root/level2')).toBe(false);
    expect(treeResource.has('root')).toBe(true);
  });

  test('should run onItemDelete handlers on data delete', () => {
    const handler = vitest.fn();

    treeResource.set('root', { name: 'root' });
    treeResource.set('root/level2', { name: 'level2' });

    treeResource.onItemDelete.addHandler(key => {
      handler();
      expect(key).toBe('root/level2');
    });

    treeResource.delete('root/level2');

    expect(handler).toHaveBeenCalled();
  });
});
