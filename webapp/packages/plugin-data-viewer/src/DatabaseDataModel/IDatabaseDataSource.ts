/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import type { IExecutionContext } from '../IExecutionContext';
import type { IDatabaseDataAction, IDatabaseDataActionClass } from './IDatabaseDataAction';
import type { IDatabaseDataActions } from './IDatabaseDataActions';
import type { IDatabaseDataEditor, IDatabaseDataResultEditor } from './IDatabaseDataEditor';
import type { IDatabaseDataResult } from './IDatabaseDataResult';

export interface IRequestInfo {
  readonly requestDuration: number;
  readonly requestMessage: string;
}

export enum DatabaseDataAccessMode {
  Default,
  Readonly
}

export interface IDatabaseDataSource<TOptions, TResult extends IDatabaseDataResult = IDatabaseDataResult> {
  readonly access: DatabaseDataAccessMode;
  readonly dataFormat: ResultDataFormat;
  readonly supportedDataFormats: ResultDataFormat[];
  readonly actions: IDatabaseDataActions<TResult>;
  readonly editor: IDatabaseDataEditor<TResult> | null;
  readonly results: TResult[];
  readonly offset: number;
  readonly count: number;
  readonly options: TOptions | null;
  readonly requestInfo: IRequestInfo;
  readonly error: Error | null;
  readonly executionContext: IExecutionContext | null;
  readonly canCancel: boolean;

  isReadonly: () => boolean;
  isLoading: () => boolean;

  hasResult: (resultIndex: number) => boolean;

  getAction: <T extends IDatabaseDataAction<TResult>>(
    resultIndex: number,
    action: IDatabaseDataActionClass<TResult, T>
  ) => T;

  /** @deprecated will be moved to getAction */
  getEditor: (resultIndex: number) => IDatabaseDataResultEditor<TResult>;
  getResult: (index: number) => TResult | null;

  setResults: (results: TResult[]) => this;
  setEditor: (editor: IDatabaseDataEditor<TResult>) => this;
  setAccess: (access: DatabaseDataAccessMode) => this;
  setSlice: (offset: number, count: number) => this;
  setOptions: (options: TOptions) => this;
  setDataFormat: (dataFormat: ResultDataFormat) => this;
  setSupportedDataFormats: (dataFormats: ResultDataFormat[]) => this;
  setExecutionContext: (context: IExecutionContext | null) => this;

  requestData: () => Promise<void> | void;
  saveData: () => Promise<void> | void;
  cancel: () => Promise<boolean> | boolean;
  clearError: () => void;
  dispose: () => Promise<void>;
}
