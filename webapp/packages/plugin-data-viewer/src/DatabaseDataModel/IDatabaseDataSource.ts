/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import type { IExecutionContext } from '../IExecutionContext';
import type { RowDiff } from '../TableViewer/TableDataModel/EditedRow';
import type { IRequestDataResult } from '../TableViewer/TableViewerModel';
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
  readonly editor: IDatabaseDataEditor<TResult> | null;
  readonly results: TResult[];
  readonly offset: number;
  readonly count: number;
  readonly options: TOptions | null;
  readonly requestInfo: IRequestInfo;
  readonly executionContext: IExecutionContext | null;
  readonly canCancel: boolean;

  isLoading: () => boolean;

  getEditor: (resultIndex: number) => IDatabaseDataResultEditor;
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
  /**
   * @deprecated will be refactored
   */
  saveDataDeprecated: (resultId: string, rows: RowDiff[]) => Promise<IRequestDataResult>;
  cancel: () => Promise<boolean> | boolean;
  dispose: () => Promise<void>;
}
