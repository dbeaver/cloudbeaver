/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { CachedDataResource } from './CachedDataResource';

interface ILoaderData {
  id: string;
  value: number;
}

const DEFAULT_STATE: () => ILoaderData[] = () => [];

const LOADER_DATA_MOCK: ILoaderData[] = [
  {
    id: '1',
    value: 1,
  },
  {
    id: '2',
    value: 2,
  },
];

async function fetchMock(): Promise<ILoaderData[]> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(LOADER_DATA_MOCK);
    }, 1);
  });
}

class TestDataResource extends CachedDataResource<ILoaderData[]> {
  constructor() {
    super(DEFAULT_STATE);
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
    expect(dataResource.data).toEqual(DEFAULT_STATE());
  });

  test('should load data', async () => {
    await dataResource.load();
    expect(dataResource.data).toEqual(LOADER_DATA_MOCK);
  });

  test('should be able to outdate the data', () => {
    dataResource.markOutdated();
    expect(dataResource.isOutdated()).toBe(true);
  });

  test('should run onDataOutdated handlers on data outdate', () => {
    const handler = jest.fn();

    dataResource.onDataOutdated.addHandler(handler);
    dataResource.markOutdated();

    expect(handler).toHaveBeenCalled();
  });

  test('should run onDataUpdate handlers on data update', () => {
    const handler = jest.fn();

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
