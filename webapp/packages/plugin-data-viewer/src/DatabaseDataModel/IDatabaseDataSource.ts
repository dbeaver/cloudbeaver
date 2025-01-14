/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IServiceProvider } from '@cloudbeaver/core-di';
import type { IExecutor } from '@cloudbeaver/core-executor';
import { type TLocalizationToken } from '@cloudbeaver/core-localization';
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import type { IDatabaseDataActionClass, IDatabaseDataActionInterface } from './IDatabaseDataAction.js';
import type { IDatabaseDataActions } from './IDatabaseDataActions.js';
import type { IDatabaseDataResult } from './IDatabaseDataResult.js';

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
  readonly requestMessage: string | TLocalizationToken;
  /** A string representation of the filters constraints applied to the data request. Also returns as it is in case of whereFilter */
  readonly requestFilter: string;
  readonly source: string | null;
}

export enum DatabaseDataAccessMode {
  Default,
  Readonly,
}

export type GetDatabaseDataSourceOptions<TSource extends IDatabaseDataSource<any, any>> =
  TSource extends IDatabaseDataSource<infer TOptions> ? TOptions : never;

export type GetDatabaseDataSourceResult<TSource extends IDatabaseDataSource<any, any>> =
  TSource extends IDatabaseDataSource<any, infer TResult> ? TResult : never;

export interface IDatabaseDataSource<TOptions = unknown, TResult extends IDatabaseDataResult = IDatabaseDataResult> {
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
  readonly canCancel: boolean;
  readonly cancelled: boolean;
  readonly serviceProvider: IServiceProvider;
  readonly onOperation: IExecutor<IDatabaseDataSourceOperationEvent>;

  isError: () => boolean;
  isOutdated: () => boolean;
  isLoadable: () => boolean;
  isReadonly: (resultIndex: number) => boolean;
  hasElementIdentifier: (resultIndex: number) => boolean;
  isDataAvailable: (offset: number, count: number) => boolean;
  isLoading: () => boolean;
  isDisabled: (resultIndex?: number) => boolean;

  hasResult: (resultIndex: number) => boolean;

  tryGetAction: (<T extends IDatabaseDataActionClass<TOptions, TResult, any>>(resultIndex: number, action: T) => InstanceType<T> | undefined) &
    (<T extends IDatabaseDataActionClass<TOptions, TResult, any>>(result: TResult, action: T) => InstanceType<T> | undefined);
  getAction: (<T extends IDatabaseDataActionClass<TOptions, TResult, any>>(resultIndex: number, action: T) => InstanceType<T>) &
    (<T extends IDatabaseDataActionClass<TOptions, TResult, any>>(result: TResult, action: T) => InstanceType<T>);
  getActionImplementation: (<T extends IDatabaseDataActionInterface<TOptions, TResult, any>>(
    resultIndex: number,
    action: T,
  ) => InstanceType<T> | undefined) &
    (<T extends IDatabaseDataActionInterface<TOptions, TResult, any>>(result: TResult, action: T) => InstanceType<T> | undefined);

  getResult: (index: number) => TResult | null;
  getResults: () => TResult[];

  setOutdated: () => this;
  setResults: (results: TResult[]) => this;
  setAccess: (access: DatabaseDataAccessMode) => this;
  setSlice: (offset: number, count: number) => this;
  setOptions: (options: TOptions) => this;
  setDataFormat: (dataFormat: ResultDataFormat) => this;
  setSupportedDataFormats: (dataFormats: ResultDataFormat[]) => this;

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
  setError: (error: Error) => this;
  resetData: () => this;
  canSafelyDispose: () => Promise<boolean>;
  dispose: () => Promise<void>;
}
