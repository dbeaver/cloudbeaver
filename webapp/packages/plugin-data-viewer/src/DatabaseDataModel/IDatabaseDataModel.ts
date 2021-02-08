/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import type { IDatabaseDataResult } from './IDatabaseDataResult';
import type { IDatabaseDataSource, IRequestInfo } from './IDatabaseDataSource';

export enum DatabaseDataAccessMode {
  Default,
  Readonly
}

export interface IDatabaseDataModel<TOptions, TResult extends IDatabaseDataResult = IDatabaseDataResult> {
  readonly id: string;
  readonly results: TResult[];
  readonly source: IDatabaseDataSource<TOptions, TResult>;
  readonly access: DatabaseDataAccessMode;
  readonly requestInfo: IRequestInfo;
  readonly supportedDataFormats: ResultDataFormat[];
  readonly countGain: number;

  isLoading: () => boolean;
  isDataAvailable: (offset: number, count: number) => boolean;

  getResult: (index: number) => TResult | null;

  setCountGain: (count: number) => this;
  setAccess: (access: DatabaseDataAccessMode) => this;
  setSlice: (offset: number, count?: number) => this;
  setOptions: (options: TOptions) => this;
  setDataFormat: (dataFormat: ResultDataFormat) => this;
  setSupportedDataFormats: (dataFormats: ResultDataFormat[]) => this;

  refresh: () => Promise<void>;
  reload: () => Promise<void>;
  requestDataPortion: (offset: number, count: number) => Promise<void>;
  requestData: () => Promise<void>;
}
