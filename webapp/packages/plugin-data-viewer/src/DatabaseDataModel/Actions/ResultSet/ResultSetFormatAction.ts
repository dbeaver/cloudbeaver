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
import { IDatabaseDataSource } from '../../IDatabaseDataSource.js';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet.js';
import { DatabaseEditChangeType, IDatabaseDataEditAction } from '../IDatabaseDataEditAction.js';
import type { IDatabaseDataFormatAction } from '../IDatabaseDataFormatAction.js';
import { isResultSetFileValue } from './isResultSetFileValue.js';
import { isResultSetGeometryValue } from './isResultSetGeometryValue.js';
import { ResultSetEditAction } from './ResultSetEditAction.js';
import { ResultSetViewAction } from './ResultSetViewAction.js';
import { injectable } from '@cloudbeaver/core-di';
import { IDatabaseDataResult } from '../../IDatabaseDataResult.js';
import { IDatabaseDataViewAction } from '../IDatabaseDataViewAction.js';
import type { IGridColumnKey, IGridDataKey } from '../Grid/IGridDataKey.js';
import { isNumber } from '@cloudbeaver/core-utils';
import type { IDatabaseValueHolder } from '../IDatabaseValueHolder.js';

export type IResultSetValue =
  | string
  | number
  | boolean
  | Record<string, string | number | Record<string, any> | null>
  | IResultSetComplexValue
  | null;

const DISPLAY_STRING_LENGTH = 200;

@injectable(() => [IDatabaseDataSource, IDatabaseDataResult, IDatabaseDataViewAction, IDatabaseDataEditAction])
export class ResultSetFormatAction
  extends DatabaseDataAction<any, IDatabaseResultSet>
  implements IDatabaseDataFormatAction<IGridDataKey, IResultSetValue, IDatabaseResultSet>
{
  static dataFormat = [ResultDataFormat.Resultset];
  private readonly view: ResultSetViewAction;
  private readonly edit?: ResultSetEditAction;

  constructor(source: IDatabaseDataSource, result: IDatabaseDataResult, view: IDatabaseDataViewAction, edit?: IDatabaseDataEditAction) {
    super(source as unknown as IDatabaseDataSource<unknown, IDatabaseResultSet>, result as IDatabaseResultSet);
    this.view = view as any as ResultSetViewAction;
    this.edit = edit as ResultSetEditAction | undefined;
  }

  isReadOnly(key: Partial<IGridDataKey>): boolean {
    if (!this.edit) {
      return true;
    }
    let readonly = false;

    if (key.column) {
      readonly = this.view.getColumn(key.column)?.readOnly || false;
    }

    if (key.column && key.row) {
      if (!readonly) {
        readonly = this.edit.getElementState(key as IGridDataKey) === DatabaseEditChangeType.delete;
      }
    }

    return readonly;
  }

  isNull({ value }: IDatabaseValueHolder<IGridDataKey, IResultSetValue>): boolean {
    return value === null;
  }

  isBinary(holder: IDatabaseValueHolder<Partial<IGridDataKey>, IResultSetValue>): boolean {
    if (!holder.key.column) {
      return false;
    }

    const column = this.view.getColumn(holder.key.column);
    if (column?.dataKind?.toLocaleLowerCase() === 'binary') {
      return true;
    }

    if (holder.key.row) {
      if (isResultSetFileValue(holder.value)) {
        return true;
      }

      if (isResultSetContentValue(holder.value)) {
        return holder.value.binary !== undefined;
      }
    }

    return false;
  }

  isGeometry(holder: IDatabaseValueHolder<Partial<IGridDataKey>, any>): boolean {
    if (holder.key.column) {
      const column = this.view.getColumn(holder.key.column);
      if (column?.dataKind?.toLocaleLowerCase() === 'geometry') {
        return true;
      }
    }

    if (holder.key.row) {
      return isResultSetComplexValue(holder.value) && holder.value.$type === 'geometry';
    }

    return false;
  }

  isNumber(holder: IDatabaseValueHolder<Partial<IGridDataKey>, any>): boolean {
    if (!holder.key?.column) {
      return false;
    }

    const column = this.view.getColumn(holder.key.column);

    if (column?.dataKind?.toLocaleLowerCase() === 'numeric') {
      return true;
    }

    if (holder.key.row && !this.isBinary(holder)) {
      if (isResultSetContentValue(holder.value)) {
        return holder.value.text !== undefined && isNumber(holder.value.text);
      }

      return isNumber(holder.value);
    }

    return false;
  }

  isText(holder: IDatabaseValueHolder<Partial<IGridDataKey>, any>): boolean {
    if (!holder.key?.column) {
      return false;
    }

    const column = this.view.getColumn(holder.key.column);

    if (column?.dataKind?.toLocaleLowerCase() === 'string') {
      return true;
    }

    if (holder.key.row && !this.isBinary(holder)) {
      if (isResultSetContentValue(holder.value)) {
        return holder.value.text !== undefined;
      }
    }

    return false;
  }

  getHeaders(): string[] {
    return this.view.columns.map(column => column.name!).filter(name => name !== undefined);
  }

  getLongestCells(column?: IGridColumnKey, offset = 0, count?: number): string[] {
    const cells: string[] = [];
    const columns = column ? [column] : this.view.columnKeys;
    count ??= this.view.rowKeys.length;

    for (let rowIndex = offset; rowIndex < offset + count; rowIndex++) {
      for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
        const key = { row: this.view.rowKeys[rowIndex]!, column: columns[columnIndex]! };
        const holder = this.get(key);
        const displayString = this.getDisplayString(holder);
        const current = cells[columnIndex] ?? '';

        if (displayString.length > current.length) {
          cells[columnIndex] = displayString;
        }
      }
    }

    return cells;
  }

  get(key: IGridDataKey): IDatabaseValueHolder<IGridDataKey, IResultSetValue> {
    return this.view.getCellHolder(key);
  }

  getText(holder: IDatabaseValueHolder<IGridDataKey, IResultSetValue>): string {
    if (holder.value === null) {
      return '';
    }

    if (isResultSetContentValue(holder.value)) {
      if (holder.value.text !== undefined) {
        return holder.value.text;
      }

      return '';
    }

    if (isResultSetGeometryValue(holder.value)) {
      if (holder.value.text !== undefined) {
        return holder.value.text;
      }

      return '';
    }

    if (isResultSetComplexValue(holder.value)) {
      if (holder.value.value !== undefined) {
        if (typeof holder.value.value === 'object' && holder.value.value !== null) {
          return JSON.stringify(holder.value.value);
        }
        return String(holder.value.value);
      }
      return '';
    }

    if (this.isBinary(holder)) {
      return '';
    }

    if (holder.value !== null && typeof holder.value === 'object') {
      return JSON.stringify(holder.value);
    }

    if (typeof holder.value === 'number' || typeof holder.value === 'boolean') {
      return String(holder.value);
    }

    return holder.value;
  }

  getNumber(holder: IDatabaseValueHolder<IGridDataKey, IResultSetValue>): number {
    if (holder.value === null) {
      return NaN;
    }

    if (isResultSetContentValue(holder.value)) {
      if (holder.value.text !== undefined) {
        return parseFloat(holder.value.text);
      }

      return NaN;
    }

    if (isResultSetGeometryValue(holder.value)) {
      if (holder.value.text !== undefined) {
        return parseFloat(holder.value.text);
      }

      return NaN;
    }

    if (isResultSetComplexValue(holder.value)) {
      if (holder.value.value !== undefined) {
        if (typeof holder.value.value === 'object' && holder.value.value !== null) {
          return NaN;
        }
        return parseFloat(holder.value.value);
      }
      return NaN;
    }

    if (this.isBinary(holder)) {
      return NaN;
    }

    if (holder.value !== null && typeof holder.value === 'object') {
      return NaN;
    }

    if (typeof holder.value === 'number') {
      return holder.value;
    }

    if (typeof holder.value === 'boolean') {
      return NaN;
    }

    return parseFloat(holder.value);
  }

  getDisplayString(holder: IDatabaseValueHolder<IGridDataKey, IResultSetValue>): string {
    if (holder.value === null) {
      return '[null]';
    }

    if (isResultSetGeometryValue(holder.value)) {
      if (holder.value.text !== undefined) {
        return this.truncateText(String(holder.value.text), DISPLAY_STRING_LENGTH);
      }

      return '[null]';
    }

    if (this.isBinary(holder)) {
      if (isResultSetContentValue(holder.value) && holder.value.text === 'null') {
        return '[null]';
      }

      return '[blob]';
    }

    if (isResultSetContentValue(holder.value)) {
      if (holder.value.text !== undefined) {
        return this.truncateText(String(holder.value.text), DISPLAY_STRING_LENGTH);
      }

      return '[null]';
    }

    if (isResultSetComplexValue(holder.value)) {
      if (holder.value.value !== undefined) {
        if (typeof holder.value.value === 'object' && holder.value.value !== null) {
          return JSON.stringify(holder.value.value);
        }

        return String(holder.value.value);
      }

      return '[null]';
    }

    return this.truncateText(String(holder.value), DISPLAY_STRING_LENGTH);
  }

  truncateText(text: string, length: number): string {
    return text
      .slice(0, length)
      .split('')
      .map(v => (v.charCodeAt(0) < 32 ? ' ' : v))
      .join('');
  }
}
