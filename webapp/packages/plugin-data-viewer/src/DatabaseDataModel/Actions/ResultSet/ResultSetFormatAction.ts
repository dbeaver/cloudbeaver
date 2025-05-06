/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { isResultSetContentValue, isResultSetComplexValue, type IResultSetComplexValue } from '@dbeaver/result-set-api';

import { DatabaseDataAction } from '../../DatabaseDataAction.js';
import type { IDatabaseDataSource } from '../../IDatabaseDataSource.js';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet.js';
import { databaseDataAction } from '../DatabaseDataActionDecorator.js';
import { DatabaseEditChangeType } from '../IDatabaseDataEditAction.js';
import type { IDatabaseDataFormatAction } from '../IDatabaseDataFormatAction.js';
import type { IResultSetColumnKey, IResultSetElementKey, IResultSetPartialKey } from './IResultSetDataKey.js';
import { isResultSetFileValue } from './isResultSetFileValue.js';
import { isResultSetGeometryValue } from './isResultSetGeometryValue.js';
import { ResultSetEditAction } from './ResultSetEditAction.js';
import { ResultSetViewAction } from './ResultSetViewAction.js';

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

      if (isResultSetFileValue(value)) {
        return true;
      }

      if (isResultSetContentValue(value)) {
        return value.binary !== undefined;
      }
    }

    return false;
  }

  isGeometry(key: IResultSetPartialKey) {
    if (key.column) {
      const column = this.view.getColumn(key.column);
      if (column?.dataKind?.toLocaleLowerCase() === 'geometry') {
        return true;
      }
    }

    if (key.row) {
      const value = this.get(key as IResultSetElementKey);
      return isResultSetComplexValue(value) && value.$type === 'geometry';
    }

    return false;
  }

  isText(key: IResultSetPartialKey): boolean {
    if (!key?.column) {
      return false;
    }

    const column = this.view.getColumn(key.column);

    if (column?.dataKind?.toLocaleLowerCase() === 'string') {
      return true;
    }

    if (key.row && !this.isBinary(key)) {
      const value = this.get(key as IResultSetElementKey);

      if (isResultSetContentValue(value)) {
        return value.text !== undefined;
      }
    }

    return false;
  }

  getHeaders(): string[] {
    return this.view.columns.map(column => column.name!).filter(name => name !== undefined);
  }

  getLongestCells(column?: IResultSetColumnKey, offset = 0, count?: number): string[] {
    const cells: string[] = [];
    const columns = column ? [column] : this.view.columnKeys;
    count ??= this.view.rowKeys.length;

    for (let rowIndex = offset; rowIndex < offset + count; rowIndex++) {
      for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
        const key = { row: this.view.rowKeys[rowIndex]!, column: columns[columnIndex]! };
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
      if (isResultSetContentValue(value) && value.text === 'null') {
        return '[null]';
      }

      return '[blob]';
    }

    if (isResultSetContentValue(value)) {
      if (value.text !== undefined) {
        return this.truncateText(String(value.text), DISPLAY_STRING_LENGTH);
      }

      return '[null]';
    }

    if (isResultSetComplexValue(value)) {
      if (value.value !== undefined) {
        if (typeof value.value === 'object' && value.value !== null) {
          return JSON.stringify(value.value);
        }

        return String(value.value);
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
