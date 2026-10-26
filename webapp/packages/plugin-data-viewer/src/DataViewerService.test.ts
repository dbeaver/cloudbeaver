/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable, runInAction } from 'mobx';
import { afterEach, describe, expect, test, vi } from 'vitest';

import {
  EConnectionFeature,
  createConnectionParam,
  type Connection,
  type ConnectionInfoResource,
  type ConnectionExecutionContextService,
  type IConnectionInfoParams,
} from '@cloudbeaver/core-connections';
import type { IServiceProvider } from '@cloudbeaver/core-di';
import type { AsyncTaskInfoService, SessionPermissionsResource } from '@cloudbeaver/core-root';
import type { GraphQLService } from '@cloudbeaver/core-sdk';

import { ContainerDataSource } from './ContainerDataSource.js';
import { DatabaseDataModel } from './DatabaseDataModel/DatabaseDataModel.js';
import { DatabaseDataAccessMode } from './DatabaseDataModel/IDatabaseDataSource.js';
import { DataViewerService } from './DataViewerService.js';
import type { DataViewerSettingsService } from './DataViewerSettingsService.js';

const models: DatabaseDataModel<ContainerDataSource>[] = [];

function setup() {
  const settings = observable({ disableEdit: false });
  const permissions = observable({
    admin: false,
    has() {
      return this.admin;
    },
  });
  const key = createConnectionParam('project', 'connection');
  const connection = observable({ id: key.connectionId, projectId: key.projectId, readOnly: false, features: [] as string[] });
  const connections = observable.map<string, Connection>([[key.connectionId, connection as Connection]]);
  const resource = { get: (key: IConnectionInfoParams) => connections.get(key.connectionId) };
  const viewer = new DataViewerService(
    settings as DataViewerSettingsService,
    permissions as unknown as SessionPermissionsResource,
    resource as ConnectionInfoResource,
  );
  const actions = {
    registerAction() {
      return this;
    },
    updateResults() {
      return this;
    },
  };
  const serviceProvider = { createScope: () => ({ serviceProvider: { getService: () => actions } }) } as unknown as IServiceProvider;

  function createModel(withOptions = true) {
    const source = new ContainerDataSource(
      serviceProvider,
      {} as GraphQLService,
      {} as AsyncTaskInfoService,
      {} as ConnectionExecutionContextService,
    );
    const model = new DatabaseDataModel(source);
    models.push(model);
    runInAction(() => {
      if (withOptions) {
        source.setOptions({ connectionKey: key, containerNodePath: '', constraints: [], whereFilter: '' });
      }
      viewer.trackDataAccess(model);
    });
    return model;
  }

  return { settings, permissions, key, connection, connections, viewer, createModel };
}

afterEach(async () => {
  for (const model of models.splice(0)) {
    await model.dispose();
  }
  vi.restoreAllMocks();
});

describe('DataViewerService.trackDataAccess', () => {
  test('updates all open models when editing is disabled and enabled', () => {
    const { settings, createModel } = setup();
    const openModels = [createModel(), createModel()];
    expect(openModels.map(model => model.source.access)).toEqual([DatabaseDataAccessMode.Default, DatabaseDataAccessMode.Default]);
    runInAction(() => {
      settings.disableEdit = true;
    });
    expect(openModels.map(model => model.source.access)).toEqual([DatabaseDataAccessMode.Readonly, DatabaseDataAccessMode.Readonly]);
    runInAction(() => {
      settings.disableEdit = false;
    });
    expect(openModels.map(model => model.source.access)).toEqual([DatabaseDataAccessMode.Default, DatabaseDataAccessMode.Default]);
  });

  test('uses the replacement connection from the resource and handles its removal', () => {
    const { key, connection, connections, createModel } = setup();
    const model = createModel();
    runInAction(() => {
      connections.set(key.connectionId, { ...connection, readOnly: true } as Connection);
    });
    expect(model.source.access).toBe(DatabaseDataAccessMode.Readonly);
    runInAction(() => {
      connections.set(key.connectionId, connection as Connection);
    });
    expect(model.source.access).toBe(DatabaseDataAccessMode.Default);
    runInAction(() => {
      connections.delete(key.connectionId);
    });
    expect(model.source.access).toBe(DatabaseDataAccessMode.Readonly);
    runInAction(() => {
      connections.set(key.connectionId, connection as Connection);
    });
    expect(model.source.access).toBe(DatabaseDataAccessMode.Default);
  });

  test('follows the connection key when a model is reused', () => {
    const { key, connection, connections, createModel } = setup();
    const model = createModel();
    const otherKey = createConnectionParam('project', 'other');
    runInAction(() => {
      connections.set(otherKey.connectionId, { ...connection, id: otherKey.connectionId, readOnly: true } as Connection);
      model.source.setOptions({ ...model.source.options!, connectionKey: otherKey });
    });
    expect(model.source.access).toBe(DatabaseDataAccessMode.Readonly);
    runInAction(() => {
      model.source.setOptions({ ...model.source.options!, connectionKey: key });
    });
    expect(model.source.access).toBe(DatabaseDataAccessMode.Default);
  });

  test('starts readonly until source options and connection information are available', () => {
    const { key, connection, connections, createModel } = setup();
    const model = createModel(false);
    expect(model.source.access).toBe(DatabaseDataAccessMode.Readonly);
    runInAction(() => {
      connections.delete(key.connectionId);
      model.source.setOptions({ connectionKey: key, containerNodePath: '', constraints: [], whereFilter: '' });
    });
    expect(model.source.access).toBe(DatabaseDataAccessMode.Readonly);
    runInAction(() => {
      connections.set(key.connectionId, connection as Connection);
    });
    expect(model.source.access).toBe(DatabaseDataAccessMode.Default);
  });

  test('keeps the administrator exception and connection restrictions', () => {
    const { settings, permissions, connection, createModel } = setup();
    const model = createModel();
    runInAction(() => {
      permissions.admin = true;
      settings.disableEdit = true;
    });
    expect(model.source.access).toBe(DatabaseDataAccessMode.Default);
    runInAction(() => {
      connection.readOnly = true;
    });
    expect(model.source.access).toBe(DatabaseDataAccessMode.Readonly);
    runInAction(() => {
      connection.readOnly = false;
      connection.features.push(EConnectionFeature.restrictDataEdit);
    });
    expect(model.source.access).toBe(DatabaseDataAccessMode.Readonly);
    runInAction(() => {
      connection.features = [];
    });
    expect(model.source.access).toBe(DatabaseDataAccessMode.Default);
    runInAction(() => {
      permissions.admin = false;
    });
    expect(model.source.access).toBe(DatabaseDataAccessMode.Readonly);
  });

  test('stops tracking a disposed model without affecting the remaining model', async () => {
    const { settings, createModel } = setup();
    const closed = createModel();
    const remaining = createModel();
    const setAccess = vi.spyOn(closed, 'setAccess');
    await closed.dispose();
    models.splice(models.indexOf(closed), 1);
    runInAction(() => {
      settings.disableEdit = true;
    });
    expect(setAccess).not.toHaveBeenCalled();
    expect(remaining.source.access).toBe(DatabaseDataAccessMode.Readonly);
  });
});
