/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { beforeEach, describe, expect, vitest, test } from 'vitest';

import { CachedDataResource } from './CachedDataResource.js';

interface IEntityData {
  id: string;
  value: number;
}

const DEFAULT_STATE_GETTER: () => IEntityData[] = () => [];
const DATA_MOCK_GETTER: () => IEntityData[] = () => [
  {
    id: '1',
    value: 1,
  },
  {
    id: '2',
    value: 2,
  },
];

function fetchMock(): Promise<IEntityData[]> {
  return Promise.resolve(DATA_MOCK_GETTER());
}

class TestDataResource extends CachedDataResource<IEntityData[]> {
  constructor() {
    super(DEFAULT_STATE_GETTER);
  }

  protected async loader() {
    const data = await fetchMock();
    return data;
  }
}

describe('CachedDataResource', () => {
  let dataResource: TestDataResource;

  beforeEach(() => {
    dataResource = new TestDataResource();
  });

  test('should instantiate correctly', () => {
    expect(dataResource).toBeInstanceOf(CachedDataResource);
  });

  test('should initialize with the default state', () => {
    expect(dataResource.data).toEqual(DEFAULT_STATE_GETTER());
  });

  test('should load data', async () => {
    await dataResource.load();
    expect(dataResource.data).toEqual(DATA_MOCK_GETTER());
  });

  test('should be able to outdate the data', () => {
    dataResource.markOutdated();
    expect(dataResource.isOutdated()).toBe(true);
  });

  test('should run onDataOutdated handlers on data outdate', () => {
    const handler = vitest.fn();

    dataResource.onDataOutdated.addHandler(handler);
    dataResource.markOutdated();

    expect(handler).toHaveBeenCalled();
  });

  test('should run onDataUpdate handlers on data update', () => {
    const handler = vitest.fn();

    dataResource.onDataUpdate.addHandler(handler);
    dataResource.dataUpdate();

    expect(handler).toHaveBeenCalled();
  });

  test('should be able to clear the data', async () => {
    await dataResource.load();
    dataResource.clear();

    expect(dataResource.data).toEqual([]);
  });
});
