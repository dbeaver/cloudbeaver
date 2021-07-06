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
import { isResultSetContentValue } from './isResultSetContentValue';
import { ResultSetDataAction } from './ResultSetDataAction';

export type IResultSetValue =
  string | number | boolean | Record<string, string | number | Record<string, any> | null> | null;

@databaseDataAction()
export class ResultSetFormatAction extends DatabaseDataAction<any, IDatabaseResultSet>
  implements IDatabaseDataFormatAction<IResultSetElementKey, IDatabaseResultSet> {
  static dataFormat = ResultDataFormat.Resultset;

  isReadOnly(key: IResultSetElementKey): boolean {
    let columnReadonly = false;
    let cellReadonly = false;

    const data = this.getAction(ResultSetDataAction);

    if (key.column !== undefined) {
      columnReadonly = data.getColumn(key.column)?.readOnly || false;
    }

    const value = data.getCellValue(key);

    if (isResultSetContentValue(value)) {
      cellReadonly = (
        value.binary !== undefined
        || value.contentLength !== value.text?.length
      );
    } else if (value !== null && typeof value === 'object') {
      cellReadonly = true;
    }

    return columnReadonly || cellReadonly;
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
