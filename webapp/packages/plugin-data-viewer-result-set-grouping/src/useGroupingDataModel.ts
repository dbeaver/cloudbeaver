/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect } from 'react';

import { useObjectRef, useResource } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, createConnectionParam } from '@cloudbeaver/core-connections';
import { App, useService } from '@cloudbeaver/core-di';
import { AsyncTaskInfoService, GraphQLService } from '@cloudbeaver/core-sdk';
import { DataViewerSettingsService, DatabaseDataAccessMode, DatabaseDataModel, IDatabaseDataModel, IDatabaseResultSet, TableViewerStorageService } from '@cloudbeaver/plugin-data-viewer';
import { IDataQueryOptions, QueryDataSource } from '@cloudbeaver/plugin-sql-editor';

export interface IGroupingDataModel {
  model: IDatabaseDataModel<IDataQueryOptions, IDatabaseResultSet>;
}

export function useGroupingDataModel(
  sourceModel: IDatabaseDataModel<any, IDatabaseResultSet>,
  query: string | null
): IGroupingDataModel {
  const tableViewerStorageService = useService(TableViewerStorageService);
  const app = useService(App);
  const graphQLService = useService(GraphQLService);
  const asyncTaskInfoService = useService(AsyncTaskInfoService);
  const dataViewerSettingsService = useService(DataViewerSettingsService);

  const executionContext = sourceModel.source.executionContext;
  const contextInfo = executionContext?.context;
  const connectionKey = contextInfo ? createConnectionParam(contextInfo.projectId, contextInfo.connectionId) : null;

  const connectionInfoLoader = useResource(
    useGroupingDataModel,
    ConnectionInfoResource,
    connectionKey
  );
  const connectionInfo = connectionInfoLoader.data;

  const model = useObjectRef(() => {
    const source = new QueryDataSource(
      app.getServiceInjector(),
      graphQLService,
      asyncTaskInfoService,
    );

    const model = tableViewerStorageService.add(new DatabaseDataModel(source));

    model
      .setAccess(DatabaseDataAccessMode.Readonly)
      .setCountGain(dataViewerSettingsService.getDefaultRowsCount())
      .setSlice(0);

    return {
      source,
      model,
      dispose() {
        this.model.dispose();
        tableViewerStorageService.remove(this.model.id);
      },
    };
  }, false, ['dispose']);

  useEffect(() => {
    if (!connectionInfo || !connectionKey) {
      return;
    }

    if (query) {
      model.model
        .setOptions({
          query,
          connectionKey,
          constraints: [],
          whereFilter: '',
        })
        .setCountGain(dataViewerSettingsService.getDefaultRowsCount())
        .setSlice(0)
        .source
        .setExecutionContext(executionContext)
        .setSupportedDataFormats(connectionInfo.supportedDataFormats)
        .setResults([])
        .setOutdated();
    } else {
      model.model
        .setOptions({
          query: '',
          connectionKey,
          constraints: [],
          whereFilter: '',
        })
        .setCountGain(dataViewerSettingsService.getDefaultRowsCount())
        .setSlice(0)
        .source
        .setExecutionContext(executionContext)
        .setSupportedDataFormats(connectionInfo.supportedDataFormats)
        .setResults([]);
    }

    sourceModel.onDispose.addHandler(model.dispose);
    return () => {
      sourceModel.onDispose.removeHandler(model.dispose);
    };
  }, [sourceModel, executionContext, connectionInfo, query]);

  useEffect(() => model.dispose, []);

  return {
    model: model.model,
  };
}