/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import type { IDatabaseDataResult } from './IDatabaseDataResult';
import type { DatabaseDataAccessMode, IDatabaseDataSource, IRequestInfo } from './IDatabaseDataSource';

export interface IDatabaseDataModel<TOptions = any, TResult extends IDatabaseDataResult = IDatabaseDataResult> {
  readonly id: string;
  readonly source: IDatabaseDataSource<TOptions, TResult>;
  readonly requestInfo: IRequestInfo;
  readonly supportedDataFormats: ResultDataFormat[];
  readonly countGain: number;

  isReadonly: () => boolean;
  isDisabled: (resultIndex: number) => boolean;
  isLoading: () => boolean;
  isDataAvailable: (offset: number, count: number) => boolean;

  getResult: (index: number) => TResult | null;

  setAccess: (access: DatabaseDataAccessMode) => this;
  setCountGain: (count: number) => this;
  setSlice: (offset: number, count?: number) => this;
  setOptions: (options: TOptions) => this;
  setDataFormat: (dataFormat: ResultDataFormat) => this;
  setSupportedDataFormats: (dataFormats: ResultDataFormat[]) => this;

  retry: () => Promise<void>;
  refresh: () => Promise<void>;
  reload: () => Promise<void>;
  requestDataPortion: (offset: number, count: number) => Promise<void>;
  requestData: () => Promise<void>;
  cancel: () => Promise<void> | void;
  dispose: () => Promise<void>;
}
