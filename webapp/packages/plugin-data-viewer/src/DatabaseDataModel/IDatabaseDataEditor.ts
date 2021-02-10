/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IDatabaseDataResult } from './IDatabaseDataResult';

export enum DataUpdateType {
  delete,
  update,
  add
}

export interface IResultEditingDiff {
  source: any[];
  update: any[];
  type: DataUpdateType;
}

export interface IDataUpdate {
  resultId: string;
  diff: Map<number, IResultEditingDiff>;
}

export interface IDatabaseDataEditor<TResult extends IDatabaseDataResult> {
  isResultEdited: (result: TResult) => boolean;
  isRowEdited: (result: TResult, row: number) => boolean;
  isCellEdited: (result: TResult, row: number, column: number) => boolean;
  get: (result: TResult, row: number) => void;
  set: (result: TResult, row: number, value: any) => void;
  getCell: (result: TResult, row: number, column: number) => void;
  setCell: (result: TResult, row: number, column: number, value: any) => void;
  revert: (result: TResult, row: number) => void;
  revertCell: (result: TResult, row: number, column: number) => void;

  getResultEditor: (result: TResult) => IDatabaseDataResultEditor;

  getChanges: () => IDataUpdate[];
  cancelChanges: () => void;
  cancelResultChanges: (result: TResult) => void;
}

export interface IDatabaseDataResultEditor {
  isEdited: () => boolean;
  isRowEdited: (row: number) => boolean;
  isCellEdited: (row: number, column: number) => boolean;
  get: (row: number) => void;
  set: (row: number, value: any) => void;
  getCell: (row: number, column: number) => void;
  setCell: (row: number, column: number, value: any) => void;
  revert: (row: number) => void;
  revertCell: (row: number, column: number) => void;
  cancelChanges: () => void;
}
