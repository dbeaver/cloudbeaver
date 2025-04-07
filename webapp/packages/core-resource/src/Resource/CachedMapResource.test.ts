/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { beforeEach, describe, expect, vitest, test } from 'vitest';
import { toJS } from 'mobx';

import { CachedMapResource } from './CachedMapResource.js';
import type { ResourceKey } from './ResourceKey.js';
import { resourceKeyList } from './ResourceKeyList.js';

interface IEntityData {
  id: string;
  value: number;
}

const ERROR_ITEM_ID = 'error';

const DATA_MOCK_GETTER: () => IEntityData[] = () => [
  {
    id: '1',
    value: 1,
  },
  {
    id: '2',
    value: 2,
  },
  {
    id: ERROR_ITEM_ID,
    value: 3,
  },
];

const TEST_ERROR_MESSAGE = 'Test error';
const DEFAULT_STATE_GETTER = () => new Map();

function fetchMock(key: ResourceKey<string> | undefined): Promise<IEntityData[]> {
  const data = DATA_MOCK_GETTER();

  return new Promise((resolve, reject) => {
    if (key) {
      if (key === ERROR_ITEM_ID) {
        reject(new Error(TEST_ERROR_MESSAGE));
      }

      const item = data.find(d => d.id === key);
      if (item) {
        resolve([item]);
      }
    } else {
      resolve(data);
    }
  });
}

class TestMapResource extends CachedMapResource<string, IEntityData> {
  constructor() {
    super(DEFAULT_STATE_GETTER);
  }

  protected async loader(key: ResourceKey<string>) {
    const data = await fetchMock(key);
    this.replace(resourceKeyList(data.map(d => d.id)), data);
    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}

describe('CachedMapResource', () => {
  let mapResource: TestMapResource;

  beforeEach(() => {
    mapResource = new TestMapResource();
  });

  test('should instantiate correctly', () => {
    expect(mapResource).toBeInstanceOf(CachedMapResource);
  });

  test('should initialize with the initial value', () => {
    expect(toJS(mapResource.data)).toEqual(DEFAULT_STATE_GETTER());
  });

  test('should return all entries', () => {
    mapResource.set('key1', { id: 'key1', value: 1 });
    mapResource.set('key2', { id: 'key2', value: 2 });
    expect(mapResource.entries).toEqual([
      ['key1', { id: 'key1', value: 1 }],
      ['key2', { id: 'key2', value: 2 }],
    ]);
  });

  test('should return all values', () => {
    mapResource.set('key1', { id: 'key1', value: 1 });
    mapResource.set('key2', { id: 'key2', value: 2 });
    expect(mapResource.values).toEqual([
      { id: 'key1', value: 1 },
      { id: 'key2', value: 2 },
    ]);
  });

  test('should return all keys', () => {
    mapResource.set('key1', { id: 'key1', value: 1 });
    mapResource.set('key2', { id: 'key2', value: 2 });
    expect(mapResource.keys).toEqual(['key1', 'key2']);
  });

  test('should load data for a specific key', async () => {
    await mapResource.load('1');
    expect(mapResource.get('1')).toEqual({ id: '1', value: 1 });
    expect(mapResource.get('2')).toBeUndefined(); // This key was not loaded
  });

  test('should NOT load data for a key that produces an error', async () => {
    await expect(mapResource.load(ERROR_ITEM_ID)).rejects.toThrow(TEST_ERROR_MESSAGE);
    expect(mapResource.get(ERROR_ITEM_ID)).toBeUndefined();
  });

  test('should mark loaded data as loaded', async () => {
    await mapResource.load('1');
    expect(mapResource.isLoaded('1')).toBe(true);
  });

  test('should set and get a value', () => {
    mapResource.set('key1', { id: 'key1', value: 1 });
    expect(mapResource.get('key1')).toStrictEqual({ id: 'key1', value: 1 });
  });

  test('should delete a value', () => {
    mapResource.set('key1', { id: 'key1', value: 1 });
    mapResource.delete('key1');
    expect(mapResource.get('key1')).toBeUndefined();
  });

  test('should check if a key exists', () => {
    mapResource.set('key1', { id: 'key1', value: 1 });
    expect(mapResource.has('key1')).toBe(true);
    expect(mapResource.has('key2')).toBe(false);
  });

  test('should replace multiple keys', () => {
    mapResource.set('key1', { id: 'key1', value: 1 });
    mapResource.set('key2', { id: 'key2', value: 2 });
    mapResource.set('key4', { id: 'key4', value: 4 });

    mapResource.replace(resourceKeyList(['key1', 'key3']), [
      { id: 'key1', value: 11 },
      { id: 'key3', value: 33 },
    ]);

    expect(mapResource.get('key1')).toStrictEqual({ id: 'key1', value: 11 });
    expect(mapResource.get('key2')).toBeUndefined();
    expect(mapResource.get('key3')).toStrictEqual({ id: 'key3', value: 33 });
    expect(mapResource.data.size).toBe(2);
  });

  test('should outdated certain keys', () => {
    mapResource.set('key1', { id: 'key1', value: 1 });
    mapResource.set('key2', { id: 'key2', value: 2 });

    mapResource.markOutdated('key1');

    expect(mapResource.isOutdated('key1')).toBe(true);
    expect(mapResource.isOutdated('key2')).toBe(false);
  });

  test('should run onDataOutdated handlers on data outdate', () => {
    const handler = vitest.fn();

    mapResource.set('key1', { id: 'key1', value: 1 });
    mapResource.set('key2', { id: 'key2', value: 2 });

    mapResource.onDataOutdated.addHandler(key => {
      handler();
      expect(key).toBe('key1');
    });

    mapResource.markOutdated('key1');
    expect(handler).toHaveBeenCalled();
  });

  test('should run onDataUpdate handlers on data update', () => {
    const handler = vitest.fn();

    mapResource.set('key1', { id: 'key1', value: 1 });
    mapResource.set('key2', { id: 'key2', value: 2 });

    mapResource.onDataUpdate.addHandler(key => {
      handler();
      expect(key).toBe('key2');
    });

    mapResource.dataUpdate('key2');
    expect(handler).toHaveBeenCalled();
  });

  test('should run onItemDelete handlers on data delete', () => {
    const handler = vitest.fn();

    mapResource.set('key1', { id: 'key1', value: 1 });
    mapResource.set('key2', { id: 'key2', value: 2 });

    mapResource.onItemDelete.addHandler(key => {
      handler();
      expect(key).toBe('key1');
    });

    mapResource.delete('key1');
    expect(handler).toHaveBeenCalled();
  });

  test('should run onItemUpdate handlers on item update', () => {
    const handler = vitest.fn();

    mapResource.set('key1', { id: 'key1', value: 1 });
    mapResource.set('key2', { id: 'key2', value: 2 });

    mapResource.onItemUpdate.addHandler(key => {
      handler();
      expect(key).toBe('key2');
    });

    mapResource.set('key2', { id: 'key2', value: 22 });
    expect(handler).toHaveBeenCalled();
  });

  test('should run onDataError handlers on data error', async () => {
    const handler = vitest.fn();

    mapResource.set('key1', { id: 'key1', value: 1 });
    mapResource.set('key2', { id: 'key2', value: 2 });

    mapResource.onDataError.addHandler(data => {
      handler();
      expect(data.param).toBe(ERROR_ITEM_ID);
      expect(data.exception.message).toBe(TEST_ERROR_MESSAGE);
    });

    await expect(mapResource.load(ERROR_ITEM_ID)).rejects.toThrow(TEST_ERROR_MESSAGE);
    expect(handler).toHaveBeenCalled();
  });

  test('should be able to get an exception if the one occurred for the key', async () => {
    await expect(mapResource.load(ERROR_ITEM_ID)).rejects.toThrow(TEST_ERROR_MESSAGE);
    expect(mapResource.getException(ERROR_ITEM_ID)?.message).toBe(TEST_ERROR_MESSAGE);
  });
});
