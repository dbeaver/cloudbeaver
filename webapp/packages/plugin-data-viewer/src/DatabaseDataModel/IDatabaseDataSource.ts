/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IConnectionExecutionContext } from '@cloudbeaver/core-connections';
import type { IServiceProvider } from '@cloudbeaver/core-di';
import type { IExecutor, ITask } from '@cloudbeaver/core-executor';
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import type { IDatabaseDataAction, IDatabaseDataActionClass, IDatabaseDataActionInterface } from './IDatabaseDataAction';
import type { IDatabaseDataActions } from './IDatabaseDataActions';
import type { IDatabaseDataResult } from './IDatabaseDataResult';

export enum DatabaseDataSourceOperation {
  /** Abstract operation with data, should not lead to data lost */
  Task = 'task',
  /** Saving operation */
  Save = 'save',
  /** May lead to data lost */
  Request = 'request',
}
export interface IDatabaseDataSourceOperationEvent {
  stage: 'request' | 'before' | 'after';
  operation: DatabaseDataSourceOperation;
}

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
  readonly serviceProvider: IServiceProvider;
  readonly totalCountRequestTask: ITask<number> | null;
  readonly onOperation: IExecutor<IDatabaseDataSourceOperationEvent>;

  isOutdated: () => boolean;
  isLoadable: () => boolean;
  isReadonly: (resultIndex: number) => boolean;
  isDataAvailable: (offset: number, count: number) => boolean;
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
  loadTotalCount: (resultIndex: number) => Promise<ITask<number>>;
  cancelLoadTotalCount: () => Promise<ITask<number> | null>;

  retry: () => Promise<void>;
  /**
   * Perform operation with data source. This action should not lead to data lost. Can be cancelled when operation is Task.
   * @param operation Task or Promise
   * @returns
   */
  runOperation: <T>(operation: () => Promise<T>) => Promise<T | null>;
  requestDataPortion(offset: number, count: number): Promise<void>;
  requestData: (mutation?: () => void) => Promise<void>;
  refreshData: () => Promise<void>;
  saveData: () => Promise<void>;
  cancel: () => Promise<void>;
  clearError: () => this;
  resetData: () => this;
  canSafelyDispose: () => Promise<boolean>;
  dispose: (keepExecutionContext?: boolean) => Promise<void>;
}
