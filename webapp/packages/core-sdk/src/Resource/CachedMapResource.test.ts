/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { CachedMapResource } from './CachedMapResource';
import type { ResourceKey } from './ResourceKey';
import { resourceKeyList } from './ResourceKeyList';

interface ILoaderData {
  id: string;
  value: number;
}

const ERROR_ITEM_ID = 'error';

const LOADER_DATA_MOCK: ILoaderData[] = [
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

class TestMapResource extends CachedMapResource<string, ILoaderData> {
  constructor() {
    super();
  }

  async fetchAnError() {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(TEST_ERROR_MESSAGE));
      }, 1);
    });
  }

  private async fetchFromAPI(key: ResourceKey<string> | undefined): Promise<ILoaderData[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        if (key) {
          const data = LOADER_DATA_MOCK.find(d => d.id === key);
          if (data) {
            resolve([data]);
          }
        } else {
          resolve(LOADER_DATA_MOCK);
        }
      }, 1);
    });
  }

  protected async loader(key: ResourceKey<string>) {
    if (key === ERROR_ITEM_ID) {
      await this.fetchAnError();
    }

    const data = await this.fetchFromAPI(key);
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

  test('should initialize with an empty map', () => {
    expect(mapResource.entries).toEqual([]);
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

  test('should change loaded state when data is loaded ', async () => {
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
    mapResource.replace(resourceKeyList(['key1', 'key3']), [
      { id: 'key1', value: 11 },
      { id: 'key3', value: 33 },
    ]);
    expect(mapResource.get('key1')).toStrictEqual({ id: 'key1', value: 11 });
    expect(mapResource.get('key2')).toBeUndefined();
    expect(mapResource.get('key3')).toStrictEqual({ id: 'key3', value: 33 });
  });

  test('should outdated certain keys', () => {
    mapResource.set('key1', { id: 'key1', value: 1 });
    mapResource.set('key2', { id: 'key2', value: 2 });

    mapResource.markOutdated('key1');

    expect(mapResource.isOutdated('key1')).toBe(true);
    expect(mapResource.isOutdated('key2')).toBe(false);
  });

  test('should run onDataOutdated handlers on data outdate', () => {
    mapResource.set('key1', { id: 'key1', value: 1 });
    mapResource.set('key2', { id: 'key2', value: 2 });

    mapResource.onDataOutdated.addHandler(key => {
      expect(key).toBe('key1');
    });

    mapResource.markOutdated('key1');
  });

  test('should run onDataUpdate handlers on data update', () => {
    mapResource.set('key1', { id: 'key1', value: 1 });
    mapResource.set('key2', { id: 'key2', value: 2 });

    mapResource.onDataUpdate.addHandler(key => {
      expect(key).toBe('key2');
    });

    mapResource.dataUpdate('key2');
  });

  test('should run onItemDelete handlers on data delete', () => {
    mapResource.set('key1', { id: 'key1', value: 1 });
    mapResource.set('key2', { id: 'key2', value: 2 });

    mapResource.onItemDelete.addHandler(key => {
      expect(key).toBe('key1');
    });

    mapResource.delete('key1');
  });

  test('should run onItemDelete handlers on data delete', () => {
    mapResource.set('key1', { id: 'key1', value: 1 });
    mapResource.set('key2', { id: 'key2', value: 2 });

    mapResource.onItemUpdate.addHandler(key => {
      expect(key).toBe('key2');
    });

    mapResource.set('key2', { id: 'key2', value: 22 });
  });

  test('should run onItemDelete handlers on data delete', () => {
    mapResource.set('key1', { id: 'key1', value: 1 });
    mapResource.set('key2', { id: 'key2', value: 2 });

    mapResource.set('key2', { id: 'key2', value: 22 });
  });
});
