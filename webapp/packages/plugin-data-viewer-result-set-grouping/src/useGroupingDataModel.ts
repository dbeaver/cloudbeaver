/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { reaction } from 'mobx';
import { useEffect, useRef } from 'react';

import { useObjectRef, useResource } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, createConnectionParam } from '@cloudbeaver/core-connections';
import { IServiceProvider, useService } from '@cloudbeaver/core-di';
import { AsyncTaskInfoService } from '@cloudbeaver/core-root';
import { GraphQLService } from '@cloudbeaver/core-sdk';
import { isObjectsEqual } from '@cloudbeaver/core-utils';
import {
  DatabaseDataAccessMode,
  DatabaseDataModel,
  DataViewerSettingsService,
  type IDatabaseDataModel,
  ResultSetDataSource,
  TableViewerStorageService,
} from '@cloudbeaver/plugin-data-viewer';

import { GroupingDataSource } from './GroupingDataSource.js';
import type { IDVResultSetGroupingPresentationState } from './IDVResultSetGroupingPresentationState.js';
import type { IGroupingQueryState } from './IGroupingQueryState.js';

export interface IGroupingDataModel {
  model: IDatabaseDataModel<GroupingDataSource>;
}

export function useGroupingDataModel(
  sourceModel: IDatabaseDataModel<ResultSetDataSource>,
  sourceResultIndex: number,
  state: IGroupingQueryState & IDVResultSetGroupingPresentationState,
): IGroupingDataModel {
  const tableViewerStorageService = useService(TableViewerStorageService);
  const serviceProvider = useService(IServiceProvider);
  const graphQLService = useService(GraphQLService);
  const asyncTaskInfoService = useService(AsyncTaskInfoService);
  const dataViewerSettingsService = useService(DataViewerSettingsService);

  const executionContext = sourceModel.source.executionContext;
  const contextInfo = executionContext?.context;
  const connectionKey = contextInfo ? createConnectionParam(contextInfo.projectId, contextInfo.connectionId) : null;

  const connectionInfoLoader = useResource(useGroupingDataModel, ConnectionInfoResource, connectionKey);
  const connectionInfo = connectionInfoLoader.data;

  const model = useObjectRef(
    () => {
      if (tableViewerStorageService.has(state.modelId)) {
        const model = tableViewerStorageService.get(state.modelId) as IDatabaseDataModel<GroupingDataSource>;
        return {
          source: model.source,
          model,
          dispose() {
            this.model.dispose();
            tableViewerStorageService.remove(state.modelId);
          },
        };
      }
      const source = new GroupingDataSource(serviceProvider, graphQLService, asyncTaskInfoService);

      source.setKeepExecutionContextOnDispose(true);
      const model = tableViewerStorageService.add(new DatabaseDataModel(source));
      state.modelId = model.id;

      model.setAccess(DatabaseDataAccessMode.Readonly).setCountGain(dataViewerSettingsService.getDefaultRowsCount()).setSlice(0);

      return {
        source,
        model,
        dispose() {
          this.model.dispose();
          tableViewerStorageService.remove(this.model.id);
        },
      };
    },
    false,
    ['dispose'],
  );

  const prevStateRef = useRef({
    columns: state.columns,
    functions: state.functions,
    showDuplicatesOnly: state.showDuplicatesOnly,
    sourceResultId: sourceModel.source.getResult(sourceResultIndex)?.id,
  });

  useEffect(() => {
    sourceModel.onDispose.addHandler(model.dispose);
    return () => {
      sourceModel.onDispose.removeHandler(model.dispose);
    };
  }, [sourceModel]);

  useEffect(() => {
    const sub = reaction(
      () => {
        const result = sourceModel.source.getResult(sourceResultIndex);

        return {
          columns: state.columns,
          functions: state.functions,
          showDuplicatesOnly: state.showDuplicatesOnly,
          sourceResultId: result?.id,
        };
      },
      async ({ columns, functions, sourceResultId, showDuplicatesOnly }) => {
        const prevState = prevStateRef.current;

        if (
          columns == prevState.columns &&
          functions == prevState.functions &&
          sourceResultId == prevState.sourceResultId &&
          showDuplicatesOnly == prevState.showDuplicatesOnly
        ) {
          return;
        }

        prevStateRef.current = { columns, functions, sourceResultId, showDuplicatesOnly };

        if (columns.length !== 0 && functions.length !== 0 && sourceResultId) {
          const executionContext = sourceModel.source.executionContext;
          model.source.setExecutionContext(executionContext).setSupportedDataFormats(connectionInfo?.supportedDataFormats ?? []);
          const context = executionContext?.context;

          if (context) {
            const connectionKey = createConnectionParam(context.projectId, context.connectionId);

            model.model
              .setCountGain(dataViewerSettingsService.getDefaultRowsCount())
              .setSlice(0)
              .source.setOptions({
                query: '',
                columns,
                functions,
                showDuplicatesOnly: state.showDuplicatesOnly,
                sourceResultId,
                connectionKey,
                constraints: [],
                whereFilter: '',
              })
              .resetData();
          }
        } else {
          model.model
            .setCountGain(dataViewerSettingsService.getDefaultRowsCount())
            .setSlice(0)
            .source.setExecutionContext(null)
            .setSupportedDataFormats([])
            .clearError()
            .setResults([]);
        }
      },
      { fireImmediately: true, equals: isObjectsEqual },
    );

    return sub;
  }, [state, sourceModel, sourceResultIndex]);

  return model;
}
