/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';

import { useObservableRef, useResource } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { ILoadableState, isContainsException } from '@cloudbeaver/core-utils';
import type { ITab } from '@cloudbeaver/plugin-navigation-tabs';

import type { DataViewerTable } from './DataViewerTable';

interface ITabState {
  connectionKey: IConnectionInfoParams | undefined;
  tableId?: string;
}

type Tab = ITab<ITabState>;

interface State extends ILoadableState {
  resetException(): void;
}

export interface IDataViewerDatabaseDataModel extends State {
  dataViewerTable: DataViewerTable;
  tab: Tab;
  _exception?: Error[] | Error | null;
  _loading: boolean;
  _init(): Promise<void>;
  init(tab: Tab, state: State): Promise<void>;
  load(): Promise<void>;
}

export function useDataViewerModel<T extends Tab>(tab: T, dataViewerTable: DataViewerTable, init: (tab: T, state: State) => Promise<void>) {
  const connection = useResource(useDataViewerModel, ConnectionInfoResource, tab.handlerState.connectionKey ?? null);

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
        return connection.isLoaded() && this.dataViewerTable.get(this.tab.handlerState.tableId || '') !== undefined;
      },
      isError(): boolean {
        return this.exception !== null;
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
          if (!this.tab.handlerState.connectionKey) {
            this.resetException();
            return;
          }

          await this.init(tab, this);
          this.resetException();
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
      resetException: action.bound,
      isLoaded: action.bound,
      isLoading: action.bound,
      isError: action.bound,
      reload: action.bound,
    },
    {
      tab,
      dataViewerTable,
      init,
    },
  );

  return state;
}
