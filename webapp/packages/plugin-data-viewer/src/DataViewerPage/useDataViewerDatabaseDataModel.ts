/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, observable } from 'mobx';
import { useEffect } from 'react';

import { ITab, NavNodeManagerService } from '@cloudbeaver/core-app';
import { ILoadableState, isContainsException, useMapResource, useObservableRef } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';
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

  const connections = useMapResource(useDataViewerDatabaseDataModel, connectionInfoResource, CachedMapAllKey);

  const state = useObservableRef<IDataViewerDatabaseDataModel>(() => ({
    _exception: null,
    _loading: false,
    get exception() {
      if (isContainsException(connections.exception)) {
        return connections.exception;
      }
      return this._exception;
    },
    isLoading(): boolean {
      return connections.isLoading() || this._loading;
    },
    isLoaded(): boolean {
      return connections.isLoaded() && dataViewerTableService.get(this.tab.handlerState.tableId || '') !== undefined;
    },
    async reload() {
      if (isContainsException(connections.exception)) {
        connections.reload?.();
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
        if (!this.tab.handlerState.connectionId) {
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

        if (
          model
          && !model.source.executionContext?.context
          && model.source.results.length > 0
        ) {
          model.resetData();
        }

        if (!model) {
          await connectionInfoResource.waitLoad();
          const connectionInfo = connectionInfoResource.get(this.tab.handlerState.connectionId);

          if (!connectionInfo) {
            throw new Error('Connection doesn\'t exists');
          }

          model = dataViewerTableService.create(
            connectionInfo,
            node
          );
          this.tab.handlerState.tableId = model.id;
          dataViewerDataChangeConfirmationService.trackTableDataUpdate(model.id);

          const pageState = dataViewerTabService.page.getState(this.tab);

          if (pageState) {
            const presentation = dataPresentationService.get(pageState.presentationId);

            if (presentation?.dataFormat !== undefined) {
              model.setDataFormat(presentation.dataFormat);
            }
          }
        }

        model.setName(node?.name || null);

        // TODO: used for initial data fetch, but can repeat request each time data tab is selected,
        //       so probably should be refactored and managed by presentation
        if (model.source.error === null && model.source.results.length === 0) {
          model.request();
        }
        this._exception = null;
      } catch (exception: any) {
        this._exception = exception;
      } finally {
        this._loading = false;
      }
    },
  }), {
    exception: computed,
    _loading: observable.ref,
    _exception: observable.ref,
    tab: observable.ref,
    isLoaded: action.bound,
    isLoading: action.bound,
    reload: action.bound,
  }, {
    tab,
  });

  useEffect(() => {
    state.load();
  });

  return state;
}