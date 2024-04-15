/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IConnectionExecutionContext } from '@cloudbeaver/core-connections';
import type { IServiceInjector } from '@cloudbeaver/core-di';
import type { ITask } from '@cloudbeaver/core-executor';
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import type { IDatabaseDataAction, IDatabaseDataActionClass, IDatabaseDataActionInterface } from './IDatabaseDataAction';
import type { IDatabaseDataActions } from './IDatabaseDataActions';
import type { IDatabaseDataResult } from './IDatabaseDataResult';
import type { IDatabaseResultSet } from './IDatabaseResultSet';

export interface IRequestInfo {
  readonly originalQuery: string;
  readonly requestDuration: number;
  readonly requestMessage: string;
  /** A string representation of the filters constraints applied to the data request. Also returns as it is in case of whereFilter */
  readonly requestFilter: string;
  readonly source: string | null;
}

export enum DatabaseDataAccessMode {
  Default,
  Readonly,
}

export interface IDatabaseDataSource<TOptions, TResult extends IDatabaseDataResult = IDatabaseDataResult> {
  readonly access: DatabaseDataAccessMode;
  readonly dataFormat: ResultDataFormat;
  readonly supportedDataFormats: ResultDataFormat[];
  /** Indicates whether database supports filtering and sorting via constraints */
  readonly constraintsAvailable: boolean;
  readonly actions: IDatabaseDataActions<TOptions, TResult>;
  readonly results: TResult[];
  readonly offset: number;
  readonly count: number;
  /** Options of the previous request */
  readonly prevOptions: Readonly<TOptions> | null;
  readonly options: TOptions | null;
  readonly requestInfo: IRequestInfo;
  readonly error: Error | null;
  readonly executionContext: IConnectionExecutionContext | null;
  readonly canCancel: boolean;
  readonly cancelled: boolean;
  readonly serviceInjector: IServiceInjector;
  readonly outdated: boolean;
  readonly totalCountRequestTask: ITask<number> | null;

  isLoadable: () => boolean;
  isReadonly: (resultIndex: number) => boolean;
  isLoading: () => boolean;
  isDisabled: (resultIndex: number) => boolean;

  hasResult: (resultIndex: number) => boolean;

  tryGetAction: (<T extends IDatabaseDataAction<TOptions, TResult>>(
    resultIndex: number,
    action: IDatabaseDataActionClass<TOptions, TResult, T>,
  ) => T | undefined) &
    (<T extends IDatabaseDataAction<TOptions, TResult>>(result: TResult, action: IDatabaseDataActionClass<TOptions, TResult, T>) => T | undefined);
  getAction: (<T extends IDatabaseDataAction<TOptions, TResult>>(resultIndex: number, action: IDatabaseDataActionClass<TOptions, TResult, T>) => T) &
    (<T extends IDatabaseDataAction<TOptions, TResult>>(result: TResult, action: IDatabaseDataActionClass<TOptions, TResult, T>) => T);
  getActionImplementation: (<T extends IDatabaseDataAction<TOptions, TResult>>(
    resultIndex: number,
    action: IDatabaseDataActionInterface<TOptions, TResult, T>,
  ) => T | undefined) &
    (<T extends IDatabaseDataAction<TOptions, TResult>>(
      result: TResult,
      action: IDatabaseDataActionInterface<TOptions, TResult, T>,
    ) => T | undefined);

  getResult: (index: number) => TResult | null;

  setOutdated: () => this;
  setResults: (results: TResult[]) => this;
  setAccess: (access: DatabaseDataAccessMode) => this;
  setSlice: (offset: number, count: number) => this;
  setOptions: (options: TOptions) => this;
  setDataFormat: (dataFormat: ResultDataFormat) => this;
  setSupportedDataFormats: (dataFormats: ResultDataFormat[]) => this;
  setExecutionContext: (context: IConnectionExecutionContext | null) => this;
  setTotalCount: (resultIndex: number, count: number) => this;
  loadTotalCount: (resultIndex: number) => Promise<ITask<number> | null>;
  cancelLoadTotalCount: () => Promise<ITask<number> | null>;

  retry: () => Promise<void>;
  /** Allows to perform an asynchronous action on the data source, this action will wait previous action to finish and save or load requests.
   * The data source will have a loading and disabled state while performing an action */
  runTask: <T>(task: () => Promise<T>) => Promise<T>;
  requestData: () => Promise<void> | void;
  refreshData: () => Promise<void> | void;
  saveData: () => Promise<void> | void;
  cancel: () => Promise<void> | void;
  clearError: () => this;
  resetData: () => this;
  dispose: () => Promise<void>;
  closeResults?: (results: IDatabaseResultSet[]) => Promise<void>;
}
