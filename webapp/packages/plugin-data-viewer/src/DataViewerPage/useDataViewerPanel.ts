/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect } from 'react';

import { reaction, toJS } from 'mobx';

import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';
import type { ITab } from '@cloudbeaver/plugin-navigation-tabs';
import type { IObjectViewerTabState } from '@cloudbeaver/plugin-object-viewer';

import { ContainerDataSource } from '../ContainerDataSource.js';
import { GridViewAction } from '../DatabaseDataModel/Actions/Grid/GridViewAction.js';
import { IDatabaseDataViewAction } from '../DatabaseDataModel/Actions/IDatabaseDataViewAction.js';
import { type IDatabaseDataModel } from '../DatabaseDataModel/IDatabaseDataModel.js';
import { DataPresentationService } from '../DataPresentationService.js';
import { DataViewerDataChangeConfirmationService } from '../DataViewerDataChangeConfirmationService.js';
import { DataViewerTableService } from '../DataViewerTableService.js';
import { DataViewerTableStateService } from '../DataViewerTableState/DataViewerTableStateService.js';
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
  const dataViewerTableStateService = useService(DataViewerTableStateService);

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

        try {
          const persistedState = dataViewerTableStateService.restoreState(tab.handlerState.objectId);

          if (persistedState && model.source.options) {
            model.source.options.constraints = persistedState.constraints.map(c => ({
              attributeName: c.attributeName,
              operator: c.operator,
              value: c.value,
              orderAsc: c.orderAsc,
              orderPosition: c.orderPosition,
            }));
            model.source.options.whereFilter = persistedState.whereFilter || '';
            model.source.options.pendingPinnedColumns = persistedState.pinnedColumns.length > 0 ? persistedState.pinnedColumns : undefined;
            model.source.options.pendingColumnOrder = persistedState.columnOrder?.length ? persistedState.columnOrder : undefined;
          }
        } catch (exception: any) {
          console.warn('[DataViewerTableState] Failed to restore state', exception);
        }

        model.source.setOutdated();
        dataViewerDataChangeConfirmationService.trackTableDataUpdate(model.id);

        const pageState = dataViewerTabService.page.getState(tab);

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

    const disposer = reaction(
      () => {
        const options = dbModel.source.options;

        if (!options) {
          return null;
        }

        const viewAction = dbModel.source.tryGetAction(0, IDatabaseDataViewAction, GridViewAction);

        return {
          constraints: toJS(options.constraints),
          whereFilter: options.whereFilter,
          pinnedColumns: viewAction ? Array.from(viewAction.pinnedColumns) : [],
          columnKeys: viewAction?.columnKeys.map(k => k.index) ?? [],
        };
      },
      current => {
        if (!current) {
          return;
        }

        try {
          dataViewerTableStateService.saveState(tab.handlerState.objectId, dbModel);
        } catch (exception: any) {
          console.warn('[DataViewerTableState] Auto-save failed', exception);
        }
      },
      { delay: 1000, fireImmediately: false },
    );

    return disposer;
  }, [tableId, tableViewerStorageService, dataViewerTableStateService, tab.handlerState.objectId]);

  return model;
}
