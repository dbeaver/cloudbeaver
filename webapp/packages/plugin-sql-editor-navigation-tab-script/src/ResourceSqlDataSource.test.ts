/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test, vi } from 'vitest';

import type { IResourceSqlDataSourceState } from './IResourceSqlDataSourceState.js';
import { ResourceSqlDataSource } from './ResourceSqlDataSource.js';

describe('ResourceSqlDataSource', () => {
  test('loads a linked connection before restoring the execution context', async () => {
    const connection = {
      projectId: 'connection-project',
      connectionId: 'connection-id',
      id: '-1',
    };
    let connectionLoaded = false;
    const loadConnection = vi.fn(() => {
      connectionLoaded = true;
      return Promise.resolve();
    });
    const state: IResourceSqlDataSourceState = {
      resourceKey: 'script-project/Scripts/script.sql',
      script: '',
      baseScript: '',
      history: { history: [], historyIndex: 0 },
    };
    const resourceManagerResource = {
      onDataOutdated: { addHandler: vi.fn(), removeHandler: vi.fn() },
      useTracker: {
        use: vi.fn(() => 'use-id'),
        free: vi.fn(),
      },
    };
    const dataSource = new ResourceSqlDataSource(
      { state: true } as ConstructorParameters<typeof ResourceSqlDataSource>[0],
      {
        load: vi.fn(),
        getNameWithoutExtension: vi.fn(),
        get: vi.fn(),
        isOutdated: vi.fn(() => false),
      } as unknown as ConstructorParameters<typeof ResourceSqlDataSource>[1],
      {
        has: vi.fn(() => connectionLoaded),
        load: loadConnection,
      } as unknown as ConstructorParameters<typeof ResourceSqlDataSource>[2],
      resourceManagerResource as unknown as ConstructorParameters<typeof ResourceSqlDataSource>[3],
      { autoSave: false } as ConstructorParameters<typeof ResourceSqlDataSource>[4],
      { userProject: undefined } as ConstructorParameters<typeof ResourceSqlDataSource>[5],
      state,
    );
    dataSource.setActions({
      rename: vi.fn(),
      read: vi.fn(() => Promise.resolve('select 1')),
      write: vi.fn(),
      getProperties: vi.fn(() => Promise.resolve(connection)),
      setProperties: vi.fn(),
    });

    await dataSource.load();

    expect(loadConnection).toHaveBeenCalledWith({ projectId: 'connection-project', connectionId: 'connection-id' });
  });
});
