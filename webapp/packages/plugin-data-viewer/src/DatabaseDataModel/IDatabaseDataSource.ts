/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createService, type IServiceProvider, type SingleServiceType } from '@cloudbeaver/core-di';
import type { IExecutor, ISyncExecutor } from '@cloudbeaver/core-executor';
import { type TLocalizationToken } from '@cloudbeaver/core-localization';
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

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
  /** The original query template with variables intact (e.g., SELECT :columnName FROM table) */
  readonly originalQuery: string;
  /** The full query that was actually executed with all substitutions and filters applied */
  readonly fullQuery: string;
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

/**
 * Feature flags for database data sources.
 * These flags control which UI actions and capabilities are available for a data source.
 * Multiple features can be combined to enable different functionality sets.
 */
export enum DatabaseDataFeature {
  /** Base database connection capability. All data sources must have this feature. */
  Database = 'Database',
  /** Table/view data editor with full edit, add, delete operations. Used for container data (tables, views). */
  DataEditor = 'DataEditor',
  /** Generic result set viewing capability with row identification and execution context management. */
  ResultSet = 'ResultSet',
  /** Query execution result display with editing capabilities. Used for SQL query results. */
  QueryResult = 'QueryResult',
  /** Data grouping and aggregation functionality. Used for GROUP BY operations. */
  Grouping = 'Grouping',
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
  readonly onResultsUpdate: ISyncExecutor<TResult[]>;

  isError: () => boolean;
  isOutdated: () => boolean;
  isLoadable: () => boolean;
  isReadonly: (resultIndex: number) => boolean;
  isDataAvailable: (offset: number, count: number) => boolean;
  isLoading: () => boolean;
  isDisabled: (resultIndex?: number) => boolean;

  hasResult: (resultIndex: number) => boolean;
  hasFeature: (feature: DatabaseDataFeature | string) => boolean;

  tryGetAction<T>(resultIndex: number, action: SingleServiceType<T, any[]>): T | undefined;
  tryGetAction<T>(result: TResult, action: SingleServiceType<T, any[]>): T | undefined;
  tryGetAction<T>(resultIndex: number, action: SingleServiceType<unknown>, implementation: SingleServiceType<T, any[]>): T | undefined;
  tryGetAction<T>(result: TResult, action: SingleServiceType<unknown>, implementation: SingleServiceType<T, any[]>): T | undefined;
  getAction<T>(resultIndex: number, action: SingleServiceType<T, any[]>): T;
  getAction<T>(result: TResult, action: SingleServiceType<T, any[]>): T;
  getAction<T>(resultIndex: number, action: SingleServiceType<unknown>, implementation: SingleServiceType<T, any[]>): T;
  getAction<T>(result: TResult, action: SingleServiceType<unknown>, implementation: SingleServiceType<T, any[]>): T;

  getResult: (index: number) => TResult | null;
  getResults: () => TResult[];

  setOutdated: () => this;
  setResults: (results: TResult[]) => this;
  setAccess: (access: DatabaseDataAccessMode) => this;
  setSlice: (offset: number, count: number) => this;
  setOptions: (options: TOptions) => this;
  setDataFormat: (dataFormat: ResultDataFormat) => this;
  setSupportedDataFormats: (dataFormats: ResultDataFormat[]) => this;
  setFeature: (feature: DatabaseDataFeature) => this;

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

export const IDatabaseDataSource = createService<IDatabaseDataSource>('IDatabaseDataSource');
