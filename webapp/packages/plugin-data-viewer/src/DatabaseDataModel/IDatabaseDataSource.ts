/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ResultDataFormat, SqlResultSet } from '@cloudbeaver/core-sdk';

import { IDatabaseDataResult } from './IDatabaseDataResult';

export enum DataUpdateType {
  delete,
  update,
  add
}

export interface IRequestInfo {
  readonly requestDuration: number;
  readonly requestMessage: string;
}

export interface DataUpdate<T = any> {
  data: SqlResultSet;
  dataUpdate: SqlResultSet;
  type: DataUpdateType;
}

export interface IDatabaseDataSource<TOptions, TResult extends IDatabaseDataResult = IDatabaseDataResult> {
  readonly offset: number;
  readonly count: number;
  readonly options: TOptions | null;
  readonly requestInfo: IRequestInfo;
  readonly dataFormat: ResultDataFormat;
  readonly supportedDataFormats: ResultDataFormat[];

  isLoading(): boolean;
  setSlice(offset: number, count: number): this;
  setOptions(options: TOptions): this;
  setDataFormat(dataFormat: ResultDataFormat): this;
  setSupportedDataFormats(dataFormats: ResultDataFormat[]): this;
  requestData(
    prevResults: TResult[]
  ): Promise<TResult[]> | TResult[];
  saveData(
    prevResults: TResult[],
    data: DataUpdate
  ): Promise<TResult[]> | TResult[];
}
