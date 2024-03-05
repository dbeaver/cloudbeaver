/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';
import { useEffect } from 'react';

import { useObservableRef, useResource } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';
import { ILoadableState, isContainsException } from '@cloudbeaver/core-utils';
import type { ITab } from '@cloudbeaver/plugin-navigation-tabs';
import type { IObjectViewerTabState } from '@cloudbeaver/plugin-object-viewer';

import { DataPresentationService } from '../DataPresentationService';
import { DataViewerDataChangeConfirmationService } from '../DataViewerDataChangeConfirmationService';
import { DataViewerTableService } from '../DataViewerTableService';
import { DataViewerTabService } from '../DataViewerTabService';

export interface IDataViewerDatabaseDataModel extends ILoadableState {
  init(): Promise<void>;
  load(): Promise<void>;
  _exception?: Error[] | Error | null;
  _loading: boolean;
  tab: ITab<IObjectViewerTabState>;
}

export function useDataViewerDatabaseDataModel(tab: ITab<IObjectViewerTabState>) {
  const dataViewerTabService = useService(DataViewerTabService);
  const navNodeManagerService = useService(NavNodeManagerService);
  const dataViewerTableService = useService(DataViewerTableService);
  const connectionInfoResource = useService(ConnectionInfoResource);
  const dataPresentationService = useService(DataPresentationService);
  const dataViewerDataChangeConfirmationService = useService(DataViewerDataChangeConfirmationService);

  const connection = useResource(useDataViewerDatabaseDataModel, ConnectionInfoResource, tab.handlerState.connectionKey ?? null);

  const state = useObservableRef<IDataViewerDatabaseDataModel>(
    () => ({
      _exception: null,
      _loading: false,
      get exception() {
        if (isContainsException(connection.exception)) {
          return connection.exception;
        }
        return this._exception;
      },
      isLoading(): boolean {
        return connection.isLoading() || this._loading;
      },
      isLoaded(): boolean {
        return connection.isLoaded() && dataViewerTableService.get(this.tab.handlerState.tableId || '') !== undefined;
      },
      async reload() {
        if (isContainsException(connection.exception)) {
          connection.reload();
        }
        this.init();
      },
      async load() {
        if (isContainsException(this.exception)) {
          return;
        }

        await this.init();
      },
      async init() {
        if (this._loading) {
          return;
        }
        this._loading = true;
        try {
          if (!this.tab.handlerState.connectionKey) {
            this._exception = null;
            return;
          }

          const node = navNodeManagerService.getNode({
            nodeId: this.tab.handlerState.objectId,
            parentId: this.tab.handlerState.parentId,
          });

          if (!navNodeManagerService.isNodeHasData(node)) {
            this._exception = null;
            return;
          }

          let model = dataViewerTableService.get(this.tab.handlerState.tableId || '');

          if (model && !model.source.executionContext?.context && model.source.results.length > 0) {
            model.resetData();
          }

          if (!model) {
            await connectionInfoResource.waitLoad();
            const connectionInfo = connectionInfoResource.get(this.tab.handlerState.connectionKey);

            if (!connectionInfo) {
              throw new Error("Connection doesn't exists");
            }

            model = dataViewerTableService.create(connectionInfo, node);
            this.tab.handlerState.tableId = model.id;
            model.source.setOutdated();
            dataViewerDataChangeConfirmationService.trackTableDataUpdate(model.id);

            const pageState = dataViewerTabService.page.getState(this.tab);

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
          this._exception = null;
        } catch (exception: any) {
          this._exception = exception;
        } finally {
          this._loading = false;
        }
      },
    }),
    {
      exception: computed,
      _loading: observable.ref,
      _exception: observable.ref,
      tab: observable.ref,
      isLoaded: action.bound,
      isLoading: action.bound,
      reload: action.bound,
    },
    {
      tab,
    },
  );

  useEffect(() => {
    state.load();
  });

  return state;
}
