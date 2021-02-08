/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ResultDataFormat, SqlResultSet } from '@cloudbeaver/core-sdk';

import type { IExecutionContext } from '../IExecutionContext';
import type { RowDiff } from '../TableViewer/TableDataModel/EditedRow';
import type { IRequestDataResult } from '../TableViewer/TableViewerModel';
import type { IDatabaseDataResult } from './IDatabaseDataResult';

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
  readonly executionContext: IExecutionContext | null;
  readonly supportedDataFormats: ResultDataFormat[];
  readonly canCancel: boolean;

  isLoading: () => boolean;
  setSlice: (offset: number, count: number) => this;
  setOptions: (options: TOptions) => this;
  setDataFormat: (dataFormat: ResultDataFormat) => this;
  setSupportedDataFormats: (dataFormats: ResultDataFormat[]) => this;
  setExecutionContext: (context: IExecutionContext | null) => this;
  requestData: (
    prevResults: TResult[]
  ) => Promise<TResult[]> | TResult[];
  saveData: (
    prevResults: TResult[],
    data: DataUpdate
  ) => Promise<TResult[]> | TResult[];
  /**
   * @deprecated will be refactored
   */
  saveDataDeprecated: (resultId: string, rows: RowDiff[]) => Promise<IRequestDataResult>;
  cancel: () => Promise<boolean> | boolean;
  dispose: () => Promise<void>;
}
