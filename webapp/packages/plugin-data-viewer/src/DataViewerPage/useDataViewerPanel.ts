/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect } from 'react';

import { when } from 'mobx';

import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';
import type { ITab } from '@cloudbeaver/plugin-navigation-tabs';
import type { IObjectViewerTabState } from '@cloudbeaver/plugin-object-viewer';

import { ContainerDataSource } from '../ContainerDataSource.js';
import { DatabasePersistedStateAction } from '../DatabaseDataModel/Actions/General/DatabasePersistedStateAction.js';
import { GridViewAction } from '../DatabaseDataModel/Actions/Grid/GridViewAction.js';
import { IDatabasePersistedStateAction } from '../DatabaseDataModel/Actions/IDatabasePersistedStateAction.js';
import { IDatabaseDataViewAction } from '../DatabaseDataModel/Actions/IDatabaseDataViewAction.js';
import { type IDatabaseDataModel } from '../DatabaseDataModel/IDatabaseDataModel.js';
import { DataPresentationService } from '../DataPresentationService.js';
import { DataViewerDataChangeConfirmationService } from '../DataViewerDataChangeConfirmationService.js';
import { DataViewerTableService } from '../DataViewerTableService.js';
import { validatePersistedState } from '../DataViewerTableState/validatePersistedState.js';
import { DataViewerTabService } from '../DataViewerTabService.js';
import { TableViewerStorageService } from '../TableViewer/TableViewerStorageService.js';
import { useDataViewerModel } from '../useDataViewerModel.js';

export function useDataViewerPanel(tab: ITab<IObjectViewerTabState>) {
  const dataViewerTableService = useService(DataViewerTableService);
  const tableViewerStorageService = useService(TableViewerStorageService);
  const navNodeManagerService = useService(NavNodeManagerService);
  const dataViewerTabService = useService(DataViewerTabService);
  const connectionInfoResource = useService(ConnectionInfoResource);
  const dataPresentationService = useService(DataPresentationService);
  const dataViewerDataChangeConfirmationService = useService(DataViewerDataChangeConfirmationService);

  const tableId = tab.handlerState.tableId;

  const model = useDataViewerModel(
    tab.handlerState.connectionKey,
    async () => {
      const node = navNodeManagerService.getNode({
        nodeId: tab.handlerState.objectId,
        parentId: tab.handlerState.parentId,
      });

      if (!navNodeManagerService.isNodeHasData(node)) {
        return;
      }

      let model = tableViewerStorageService.get<IDatabaseDataModel<ContainerDataSource>>(tab.handlerState.tableId || '');

      if (model && !model.isDisabled() && model.source.results.length > 0) {
        model.resetData();
      }

      if (!model) {
        await connectionInfoResource.waitLoad();
        const connectionInfo = connectionInfoResource.get(tab.handlerState.connectionKey!);

        if (!connectionInfo) {
          throw new Error("Connection doesn't exists");
        }

        model = dataViewerTableService.create(connectionInfo, node);
        tab.handlerState.tableId = model.id;

        const pageState = dataViewerTabService.page.getState(tab);

        try {
          const persistedState = pageState?.persistedState;

          if (persistedState && validatePersistedState(persistedState) && model.source.options) {
            model.source.options.constraints = persistedState.constraints.map(c => ({
              attributeName: c.attributeName,
              operator: c.operator,
              value: c.value,
              orderAsc: c.orderAsc,
              orderPosition: c.orderPosition,
            }));
            model.source.options.whereFilter = persistedState.whereFilter || '';
          }
        } catch (exception: any) {
          console.warn('[useDataViewerPanel] Failed to restore state', exception);
        }

        model.source.setOutdated();
        dataViewerDataChangeConfirmationService.trackTableDataUpdate(model.id);

        if (pageState) {
          const presentation = dataPresentationService.get(pageState.presentationId);

          if (presentation?.dataFormat !== undefined) {
            model.setDataFormat(presentation.dataFormat);
          }
        }
      }

      if (node?.name) {
        model.setName(node.name);
      }
    },
    tab.handlerState.tableId,
  );

  useEffect(() => {
    if (!tableId) {
      return;
    }

    const dbModel = tableViewerStorageService.get<IDatabaseDataModel<ContainerDataSource>>(tableId);

    if (!dbModel) {
      return;
    }

    const pageState = dataViewerTabService.page.getState(tab);

    const disposer = when(
      () => dbModel.source.results.length > 0,
      () => {
        try {
          const persistedAction = dbModel.source.tryGetAction(0, IDatabasePersistedStateAction, DatabasePersistedStateAction);

          if (persistedAction && pageState) {
            if (!pageState.persistedState) {
              pageState.persistedState = {};
            }

            persistedAction.setStore(pageState.persistedState);

            const persistedState = pageState.persistedState;

            if (persistedState && validatePersistedState(persistedState)) {
              const viewAction = dbModel.source.tryGetAction(0, IDatabaseDataViewAction, GridViewAction);

              viewAction?.restoreViewState({
                pinnedColumnNames: persistedState.pinnedColumns,
                columnOrderNames: persistedState.columnOrder,
              });
            }
          }
        } catch (exception: any) {
          console.warn('[useDataViewerPanel] Failed to initialize persisted state', exception);
        }
      },
    );

    return () => disposer();
  }, [tableId, tableViewerStorageService, dataViewerTabService, tab]);

  return model;
}
