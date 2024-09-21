/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';

import { useObservableRef, useResource } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, type IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { type ILoadableState, isContainsException } from '@cloudbeaver/core-utils';

import { TableViewerStorageService } from './TableViewer/TableViewerStorageService.js';

export interface IDataViewerDatabaseDataModel extends ILoadableState {
  connectionKey: IConnectionInfoParams | undefined;
  tableViewerStorageService: TableViewerStorageService;
  tableId?: string;
  _exception?: Error[] | Error | null;
  _loading: boolean;
  _init(): Promise<void>;
  init(): Promise<void>;
  load(): Promise<void>;
}

export function useDataViewerModel(connectionKey: IConnectionInfoParams | undefined, init: () => Promise<void>, tableId?: string) {
  const tableViewerStorageService = useService(TableViewerStorageService);
  const connection = useResource(useDataViewerModel, ConnectionInfoResource, connectionKey ?? null);

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
        return connection.isLoaded() && this.tableViewerStorageService.get(this.tableId || '') !== undefined;
      },
      isError(): boolean {
        return isContainsException(this.exception);
      },
      async reload() {
        if (isContainsException(connection.exception)) {
          connection.reload();
        }

        this._init();
      },
      async load() {
        if (isContainsException(this.exception)) {
          return;
        }

        await this._init();
      },
      resetException() {
        this._exception = null;
      },
      async _init() {
        if (this._loading) {
          return;
        }

        this._loading = true;

        try {
          if (!this.connectionKey) {
            this._exception = null;
            return;
          }

          await this.init();
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
      isLoaded: action.bound,
      isLoading: action.bound,
      isError: action.bound,
      reload: action.bound,
    },
    {
      connectionKey,
      tableId,
      tableViewerStorageService,
      init,
    },
  );

  return state;
}
