/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IConnectionExecutionContext } from '@cloudbeaver/core-connections';
import type { IServiceInjector } from '@cloudbeaver/core-di';
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import type { IDatabaseDataAction, IDatabaseDataActionClass, IDatabaseDataActionInterface } from './IDatabaseDataAction';
import type { IDatabaseDataActions } from './IDatabaseDataActions';
import type { IDatabaseDataResult } from './IDatabaseDataResult';

export interface IRequestInfo {
  readonly originalQuery: string;
  readonly requestDuration: number;
  readonly requestMessage: string;
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
  readonly constraintsAvailable: boolean;
  readonly actions: IDatabaseDataActions<TOptions, TResult>;
  readonly results: TResult[];
  readonly offset: number;
  readonly count: number;
  readonly prevOptions: Readonly<TOptions> | null;
  readonly options: TOptions | null;
  readonly requestInfo: IRequestInfo;
  readonly error: Error | null;
  readonly executionContext: IConnectionExecutionContext | null;
  readonly canCancel: boolean;
  readonly cancelled: boolean;
  readonly serviceInjector: IServiceInjector;
  readonly outdated: boolean;

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

  retry: () => Promise<void>;
  runTask: <T>(task: () => Promise<T>) => Promise<T>;
  requestData: () => Promise<void> | void;
  refreshData: () => Promise<void> | void;
  saveData: () => Promise<void> | void;
  cancel: () => Promise<void> | void;
  clearError: () => this;
  resetData: () => this;
  dispose: () => Promise<void>;
}
