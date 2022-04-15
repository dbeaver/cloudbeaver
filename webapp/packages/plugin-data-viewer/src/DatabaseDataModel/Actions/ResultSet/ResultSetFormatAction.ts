/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
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
import type { IResultSetElementKey, IResultSetPartialKey } from './IResultSetDataKey';
import { isResultSetContentValue } from './isResultSetContentValue';
import { ResultSetEditAction } from './ResultSetEditAction';
import { ResultSetViewAction } from './ResultSetViewAction';

export type IResultSetValue =
  string | number | boolean | Record<string, string | number | Record<string, any> | null> | null;

@databaseDataAction()
export class ResultSetFormatAction extends DatabaseDataAction<any, IDatabaseResultSet>
  implements IDatabaseDataFormatAction<IResultSetElementKey, IDatabaseResultSet> {
  static dataFormat = [ResultDataFormat.Resultset];

  private readonly view: ResultSetViewAction;
  private readonly edit: ResultSetEditAction;

  constructor(
    source: IDatabaseDataSource<any, IDatabaseResultSet>,
    result: IDatabaseResultSet,
    view: ResultSetViewAction,
    edit: ResultSetEditAction
  ) {
    super(source, result);
    this.view = view;
    this.edit = edit;
  }

  getHeaders(): string[] {
    return this.view.columns.map(column => column.name!).filter(name => name !== undefined);
  }

  getLongestCells(offset = 0, count?: number): string[] {
    const rows = this.view.rows.slice(offset, count);
    let cells: string[] = [];

    for (const row of rows) {
      if (cells.length === 0) {
        cells = row.map(v => this.toDisplayString(v));
        continue;
      }

      for (let i = 0; i < row.length; i++) {
        const value = this.toDisplayString(row[i]);

        if (value.length > cells[i].length) {
          cells[i] = value;
        }
      }
    }

    return cells;
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
          readonly = (
            value.binary !== undefined
            || value.contentLength !== value.text?.length
          );
        } else if (value !== null && typeof value === 'object') {
          readonly = true;
        }
      }
    }

    return readonly;
  }

  isNull(value: IResultSetValue): boolean {
    return this.get(value) === null;
  }

  get(value: IResultSetValue): IResultSetValue {
    if (value !== null && typeof value === 'object') {
      if ('text' in value) {
        return value.text;
      } else if ('value' in value) {
        return value.value;
      }
      return value;
    }

    return value;
  }

  getText(value: IResultSetValue): string | null {
    value = this.get(value);

    if (value !== null && typeof value === 'object') {
      return JSON.stringify(value);
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    return value;
  }

  toDisplayString(value: IResultSetValue): string {
    value = this.getText(value);

    if (typeof value === 'string' && value.length > 1000) {
      return value.split('').map(v => (v.charCodeAt(0) < 32 ? ' ' : v)).join('');
    }

    if (value === null) {
      return '[null]';
    }

    return String(value);
  }
}
