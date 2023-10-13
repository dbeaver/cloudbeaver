/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DatabaseDataAction } from '../../DatabaseDataAction';
import type { IDatabaseDataSource } from '../../IDatabaseDataSource';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet';
import { databaseDataAction } from '../DatabaseDataActionDecorator';
import { DatabaseEditChangeType } from '../IDatabaseDataEditAction';
import type { IDatabaseDataFormatAction } from '../IDatabaseDataFormatAction';
import type { IResultSetComplexValue } from './IResultSetComplexValue';
import type { IResultSetElementKey, IResultSetPartialKey } from './IResultSetDataKey';
import { isResultSetBlobValue } from './isResultSetBlobValue';
import { isResultSetComplexValue } from './isResultSetComplexValue';
import { isResultSetContentValue } from './isResultSetContentValue';
import { isResultSetGeometryValue } from './isResultSetGeometryValue';
import { ResultSetEditAction } from './ResultSetEditAction';
import { ResultSetViewAction } from './ResultSetViewAction';

export type IResultSetValue =
  | string
  | number
  | boolean
  | Record<string, string | number | Record<string, any> | null>
  | IResultSetComplexValue
  | null;

const DISPLAY_STRING_LENGTH = 200;

@databaseDataAction()
export class ResultSetFormatAction
  extends DatabaseDataAction<any, IDatabaseResultSet>
  implements IDatabaseDataFormatAction<IResultSetElementKey, IDatabaseResultSet>
{
  static dataFormat = [ResultDataFormat.Resultset];

  private readonly view: ResultSetViewAction;
  private readonly edit: ResultSetEditAction;

  constructor(source: IDatabaseDataSource<any, IDatabaseResultSet>, view: ResultSetViewAction, edit: ResultSetEditAction) {
    super(source);
    this.view = view;
    this.edit = edit;
  }

  isReadOnly(key: IResultSetPartialKey): boolean {
    let readonly = false;

    if (key.column) {
      readonly = this.view.getColumn(key.column)?.readOnly || false;
    }

    if (key.column && key.row) {
      if (!readonly) {
        readonly = this.edit.getElementState(key as IResultSetElementKey) === DatabaseEditChangeType.delete;
      }

      if (!readonly) {
        const value = this.view.getCellValue(key as IResultSetElementKey);

        if (isResultSetContentValue(value)) {
          readonly = value.binary !== undefined || value.contentLength !== value.text?.length;
        } else if (value !== null && typeof value === 'object') {
          readonly = true;
        }
      }
    }

    return readonly;
  }
  isNull(key: IResultSetElementKey): boolean {
    return this.get(key) === null;
  }

  isBinary(key: IResultSetPartialKey): boolean {
    if (!key.column) {
      return false;
    }

    const column = this.view.getColumn(key.column);
    if (column?.dataKind?.toLocaleLowerCase() === 'binary') {
      return true;
    }

    if (key.row) {
      const value = this.get(key as IResultSetElementKey);

      if (isResultSetBlobValue(value)) {
        return true;
      }

      if (isResultSetContentValue(value)) {
        return value.binary !== undefined;
      }
    }

    return false;
  }

  getHeaders(): string[] {
    return this.view.columns.map(column => column.name!).filter(name => name !== undefined);
  }

  getLongestCells(offset = 0, count?: number): string[] {
    const cells: string[] = [];
    const columnsCount = this.view.columnKeys.length;
    count ??= this.view.rowKeys.length;

    for (let rowIndex = offset; rowIndex < offset + count; rowIndex++) {
      for (let columnIndex = 0; columnIndex < columnsCount; columnIndex++) {
        const key = { row: this.view.rowKeys[rowIndex], column: this.view.columnKeys[columnIndex] };
        const displayString = this.getDisplayString(key);
        const current = cells[columnIndex] ?? '';

        if (displayString.length > current.length) {
          cells[columnIndex] = displayString;
        }
      }
    }

    return cells;
  }

  get(key: IResultSetElementKey): IResultSetValue {
    return this.view.getCellValue(key);
  }

  getText(key: IResultSetElementKey): string {
    const value = this.get(key);

    if (value === null) {
      return '';
    }

    if (isResultSetContentValue(value)) {
      if (value.text !== undefined) {
        return value.text;
      }

      return '';
    }

    if (isResultSetGeometryValue(value)) {
      if (value.text !== undefined) {
        return value.text;
      }

      return '';
    }

    if (isResultSetComplexValue(value)) {
      if (value.value !== undefined) {
        if (typeof value.value === 'object' && value.value !== null) {
          return JSON.stringify(value.value);
        }
        return String(value.value);
      }
      return '';
    }

    if (this.isBinary(key)) {
      return '';
    }

    if (value !== null && typeof value === 'object') {
      return JSON.stringify(value);
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    return value;
  }

  getDisplayString(key: IResultSetElementKey): string {
    const value = this.get(key);

    if (value === null) {
      return '[null]';
    }

    if (isResultSetGeometryValue(value)) {
      if (value.text !== undefined) {
        return this.truncateText(String(value.text), DISPLAY_STRING_LENGTH);
      }

      return '[null]';
    }

    if (this.isBinary(key)) {
      return '[blob]';
    }

    if (isResultSetContentValue(value)) {
      if (value.text !== undefined) {
        return this.truncateText(String(value.text), DISPLAY_STRING_LENGTH);
      }

      return '[null]';
    }

    return this.truncateText(String(value), DISPLAY_STRING_LENGTH);
  }

  truncateText(text: string, length: number): string {
    return text
      .slice(0, length)
      .split('')
      .map(v => (v.charCodeAt(0) < 32 ? ' ' : v))
      .join('');
  }
}
