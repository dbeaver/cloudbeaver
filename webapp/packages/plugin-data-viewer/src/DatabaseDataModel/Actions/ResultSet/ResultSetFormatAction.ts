/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DatabaseDataAction } from '../../DatabaseDataAction';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet';
import { databaseDataAction } from '../DatabaseDataActionDecorator';
import type { IDatabaseDataFormatAction } from '../IDatabaseDataFormatAction';
import type { IResultSetElementKey } from './IResultSetElementKey';

@databaseDataAction()
export class ResultSetFormatAction extends DatabaseDataAction<any, IDatabaseResultSet>
  implements IDatabaseDataFormatAction<IResultSetElementKey, IDatabaseResultSet> {
  static dataFormat = ResultDataFormat.Resultset;

  isReadOnly(key: IResultSetElementKey): boolean {
    let columnReadonly = false;
    let cellReadonly = false;

    if (key.column !== undefined && this.result.data?.columns) {
      columnReadonly = this.result.data.columns[key.column].readOnly;
    }

    if (key.row !== undefined && key.column !== undefined && this.result.data?.rows) {
      const value = this.result.data.rows[key.row][key.column];
      cellReadonly = this.isValueReadonly(value);
    }

    return columnReadonly || cellReadonly;
  }

  isValueReadonly(value: any): boolean {
    return value !== null && typeof value === 'object';
  }

  isNull(value: any): boolean {
    if (value !== null) {
      if (typeof value === 'object' && 'value' in value) {
        return value.value === null;
      }
      return false;
    }
    return true;
  }

  get(value: any): any {
    if (value !== null && typeof value === 'object') {
      if ('text' in value) {
        return value.text;
      } else if ('value' in value) {
        if (typeof value.value === 'object') {
          return JSON.stringify(value.value);
        }
        return value.value;
      }
      return JSON.stringify(value);
    }

    return value;
  }

  toString(value: any): string {
    value = this.get(value);

    if (typeof value === 'string' && value.length > 1000) {
      return value.split('').map(v => (v.charCodeAt(0) < 32 ? ' ' : v)).join('');
    }

    if (value === null) {
      return '[null]';
    }

    return String(value);
  }
}
