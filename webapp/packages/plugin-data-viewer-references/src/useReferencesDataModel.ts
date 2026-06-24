/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { reaction, toJS } from 'mobx';
import { useEffect, useRef } from 'react';

import { useObjectRef, useResource } from '@cloudbeaver/core-blocks';
import { ConnectionExecutionContextService, ConnectionInfoResource, createConnectionParam } from '@cloudbeaver/core-connections';
import { IServiceProvider, useService } from '@cloudbeaver/core-di';
import { AsyncTaskInfoService } from '@cloudbeaver/core-root';
import { GraphQLService, type SqlDataFilterConstraint } from '@cloudbeaver/core-sdk';
import { isObjectsEqual } from '@cloudbeaver/core-utils';
import {
  DatabaseDataAccessMode,
  DatabaseDataModel,
  DataViewerSettingsService,
  GridViewAction,
  type IDatabaseDataModel,
  IDatabaseDataViewAction,
  IDatabaseReferencesAction,
  ResultSetDataAction,
  ResultSetDataSource,
  ResultSetReferencesAction,
  ResultSetSelectAction,
  TableViewerStorageService,
} from '@cloudbeaver/plugin-data-viewer';

import { DataViewerReferencesDataSource } from './DataViewerReferencesDataSource.js';
import type { IDataViewerReferencesPresentationState } from './IDataViewerReferencesState.js';

interface IReferencesDataModel {
  model: IDatabaseDataModel<DataViewerReferencesDataSource>;
}

export function useReferencesDataModel(
  sourceModel: IDatabaseDataModel<ResultSetDataSource>,
  sourceResultIndex: number,
  state: IDataViewerReferencesPresentationState,
): IReferencesDataModel {
  const tableViewerStorageService = useService(TableViewerStorageService);
  const serviceProvider = useService(IServiceProvider);
  const graphQLService = useService(GraphQLService);
  const asyncTaskInfoService = useService(AsyncTaskInfoService);
  const dataViewerSettingsService = useService(DataViewerSettingsService);
  const connectionExecutionContextService = useService(ConnectionExecutionContextService);

  const referencesAction = sourceModel.source.getAction(sourceResultIndex, IDatabaseReferencesAction, ResultSetReferencesAction);
  const selection = sourceModel.source.getAction(sourceResultIndex, ResultSetSelectAction);
  const data = sourceModel.source.getAction(sourceResultIndex, ResultSetDataAction);
  const view = sourceModel.source.getAction(sourceResultIndex, IDatabaseDataViewAction, GridViewAction);

  const executionContext = sourceModel.source.executionContext;
  const contextInfo = executionContext?.context;
  const connectionKey = contextInfo ? createConnectionParam(contextInfo.projectId, contextInfo.connectionId) : null;

  const connectionInfoLoader = useResource(useReferencesDataModel, ConnectionInfoResource, connectionKey);
  const connectionInfo = connectionInfoLoader.data;

  const model = useObjectRef(
    () => {
      if (tableViewerStorageService.has(state.modelId)) {
        const model = tableViewerStorageService.get(state.modelId) as IDatabaseDataModel<DataViewerReferencesDataSource>;
        return {
          source: model.source,
          model,
          dispose() {
            this.model.dispose();
            tableViewerStorageService.remove(state.modelId);
          },
        };
      }
      const source = new DataViewerReferencesDataSource(serviceProvider, connectionExecutionContextService, graphQLService, asyncTaskInfoService);

      source.setKeepExecutionContextOnDispose(true);

      const model = tableViewerStorageService.add(new DatabaseDataModel(source));
      // we are updating observable object that we passed to the hook
      // eslint-disable-next-line react-hooks/immutability
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
    association: state.association,
    sourceResultId: sourceModel.source.getResult(sourceResultIndex)?.id,
    activeRows: selection.getActiveRows(),
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
        const activeRows = selection.getActiveRows();

        return {
          association: state.association,
          sourceResultId: result?.id,
          activeRows,
        };
      },
      ({ association, sourceResultId, activeRows }) => {
        const prevState = prevStateRef.current;

        if (association == prevState.association && sourceResultId == prevState.sourceResultId && isObjectsEqual(activeRows, prevState.activeRows)) {
          return;
        }

        prevStateRef.current = { association, sourceResultId, activeRows };

        if (association && sourceResultId) {
          const executionContext = sourceModel.source.executionContext;
          model.source.setExecutionContext(executionContext).setSupportedDataFormats(connectionInfo?.supportedDataFormats ?? []);
          const context = executionContext?.context;

          if (context) {
            const connectionKey = createConnectionParam(context.projectId, context.connectionId);
            const references = referencesAction.associations;

            console.log(toJS(references));
            const currentReference = references.find(r => r.associationName === association);

            if (currentReference?.targetNodePath) {
              const sourceColumn = data.columns.find(c => currentReference.columnMapping.find(m => m.sourceColumnName === c.name));
              const targetColumn = data.columns.find(c => currentReference.columnMapping.find(m => m.targetColumnName === c.name));
              const targetMapping = currentReference.columnMapping.find(m => m.sourceColumnName === sourceColumn?.name);

              console.log(toJS(sourceColumn), toJS(targetColumn), toJS(targetMapping));
              const operation = sourceColumn?.supportedOperations.find(o => o.id === 'EQUALS');

              const rows = activeRows.map(r => r.row);
              const defaultRow = view.rowKeys[0];

              if (!rows.length && defaultRow) {
                rows.push(defaultRow);
              }

              const constraints: SqlDataFilterConstraint[] = [];

              for (const row of rows) {
                const rowValue = data.getRowValue(row);

                if (rowValue) {
                  const targetValue = sourceColumn ? rowValue[sourceColumn.position] : undefined;

                  console.log('target defined', !!targetValue, 'operation defined', !!operation);
                  if (targetValue && operation) {
                    constraints.push({
                      attributeName: currentReference.isReference ? targetMapping?.targetColumnName : targetColumn?.name,
                      operator: operation.id,
                      value: String(targetValue),
                      criteria: operation.expression,
                    });
                  }
                }
              }

              model.model
                .setCountGain(dataViewerSettingsService.getDefaultRowsCount())
                .setSlice(0)
                .source.setOptions({
                  containerNodePath: currentReference.targetNodePath,
                  connectionKey,
                  constraints,
                  whereFilter: '',
                  anyConstraint: true,
                })
                .resetData();
            }
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
      { fireImmediately: true, equals: isObjectsEqual, delay: 300 },
    );

    return sub;
  }, [state, sourceModel, sourceResultIndex]);

  return model;
}
