/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { reaction } from 'mobx';
import { useEffect, useRef } from 'react';

import { isNotNullDefined } from '@dbeaver/js-helpers';
import { useObjectRef, useResource } from '@cloudbeaver/core-blocks';
import { ConnectionExecutionContextService, ConnectionInfoResource, createConnectionParam } from '@cloudbeaver/core-connections';
import { IServiceProvider, useService } from '@cloudbeaver/core-di';
import { AsyncTaskInfoService } from '@cloudbeaver/core-root';
import { GraphQLService, type SqlDataFilterConstraint, type SqlReferenceColumnMapping } from '@cloudbeaver/core-sdk';
import { isObjectsEqual } from '@cloudbeaver/core-utils';
import {
  DatabaseDataAccessMode,
  DatabaseDataModel,
  DataViewerSettingsService,
  GridViewAction,
  type IDatabaseDataModel,
  IDatabaseDataViewAction,
  IDatabaseReferencesAction,
  type IGridRowKey,
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
            const associations = referencesAction.associations;
            const currentAssociation = associations.find(r => r.associationName === association);

            // Restrict the related result to only rows that are linked to the current row via this association.
            // The target attribute name differs depending on which side of the relationship owns the foreign key.
            if (currentAssociation?.targetNodePath) {
              const rows = activeRows.map(r => r.row);
              const defaultRow = view.rowKeys[0];

              if (!rows.length && defaultRow) {
                rows.push(defaultRow);
              }

              const constraints: SqlDataFilterConstraint[] = [];
              const isCompositeKey = currentAssociation.columnMapping.length > 1;
              const shouldFallback = isCompositeKey && rows.length > 1;
              const whereFilter = shouldFallback ? getCompositeKeyFilter(rows, currentAssociation.columnMapping, data) : '';

              if (!whereFilter) {
                for (const mapping of currentAssociation.columnMapping) {
                  for (const row of rows) {
                    const rowValue = data.getRowValue(row);

                    if (rowValue) {
                      const targetValue = rowValue[mapping.sourceColumnIndex];

                      if (isNotNullDefined(targetValue)) {
                        constraints.push({
                          attributeName: mapping.targetColumnName,
                          attributePosition: mapping.targetColumnIndex,
                          operator: 'EQUALS',
                          value: targetValue,
                        });
                      }
                    }
                  }
                }
              }

              model.model
                .setCountGain(dataViewerSettingsService.getDefaultRowsCount())
                .setSlice(0)
                .source.setOptions({
                  containerNodePath: currentAssociation.targetNodePath,
                  connectionKey,
                  constraints,
                  whereFilter,
                  anyConstraint: !isCompositeKey,
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

function getCompositeKeyFilter(rows: IGridRowKey[], columnMapping: SqlReferenceColumnMapping[], data: ResultSetDataAction): string {
  const orGroups: string[] = [];

  for (const row of rows) {
    const rowValue = data.getRowValue(row);

    if (rowValue) {
      const andParts: string[] = [];

      for (const mapping of columnMapping) {
        const targetValue = rowValue[mapping.sourceColumnIndex];

        if (isNotNullDefined(targetValue)) {
          andParts.push(`${mapping.targetColumnName} = ${targetValue}`);
        }
      }

      if (andParts.length === columnMapping.length) {
        orGroups.push(`(${andParts.join(' AND ')})`);
      }
    }
  }

  if (!orGroups.length) {
    return '';
  }

  return orGroups.join(' OR ');
}
