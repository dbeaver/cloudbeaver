/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { reaction } from 'mobx';
import { useEffect } from 'react';

import { useObjectRef, useResource } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, createConnectionParam } from '@cloudbeaver/core-connections';
import { App, useService } from '@cloudbeaver/core-di';
import { AsyncTaskInfoService, GraphQLService } from '@cloudbeaver/core-sdk';
import { isObjectsEqual } from '@cloudbeaver/core-utils';
import { DataViewerSettingsService, DatabaseDataAccessMode, DatabaseDataModel, IDatabaseDataModel, IDatabaseResultSet, TableViewerStorageService } from '@cloudbeaver/plugin-data-viewer';

import { GroupingDataSource, IDataGroupingOptions } from './GroupingDataSource';
import type { IGroupingQueryState } from './IGroupingQueryState';

export interface IGroupingDataModel {
  model: IDatabaseDataModel<IDataGroupingOptions, IDatabaseResultSet>;
}

export function useGroupingDataModel(
  sourceModel: IDatabaseDataModel<any, IDatabaseResultSet>,
  sourceResultIndex: number,
  state: IGroupingQueryState,
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
    const source = new GroupingDataSource(
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
    sourceModel.onDispose.addHandler(model.dispose);
    return () => {
      sourceModel.onDispose.removeHandler(model.dispose);
    };
  }, [sourceModel]);

  useEffect(() => {
    const sub = reaction(() => {
      const result = sourceModel.source.hasResult(sourceResultIndex)
        ? sourceModel.source.getResult(sourceResultIndex)
        : null;

      return {
        columns: state.columns,
        sourceResultId: result?.id,
      };
    }, async ({ columns, sourceResultId }) => {
      if (columns.length !== 0 && sourceResultId) {
        const executionContext = sourceModel.source.executionContext;
        model.model.source
          .setExecutionContext(executionContext)
          .setSupportedDataFormats(connectionInfo?.supportedDataFormats ?? []);

        if (executionContext?.context) {
          const connectionKey = createConnectionParam(
            executionContext.context.projectId,
            executionContext.context.connectionId
          );

          model.model
            .setOptions({
              query: '',
              columns,
              sourceResultId,
              connectionKey,
              constraints: [],
              whereFilter: '',
            })
            .setCountGain(dataViewerSettingsService.getDefaultRowsCount())
            .setSlice(0)
            .source
            .setResults([])
            .setOutdated();
        }
      } else {
        model.model
          .setCountGain(dataViewerSettingsService.getDefaultRowsCount())
          .setSlice(0)
          .source
          .setExecutionContext(null)
          .setSupportedDataFormats([])
          .setResults([]);
      }

    }, { fireImmediately: true, equals: isObjectsEqual });

    return sub;
  }, [state, sourceModel, sourceResultIndex]);

  useEffect(() => model.dispose, []);

  return {
    model: model.model,
  };
}