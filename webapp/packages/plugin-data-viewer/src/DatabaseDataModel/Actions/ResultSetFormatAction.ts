/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import type { IDatabaseResultSet } from '../IDatabaseResultSet';
import { databaseDataAction } from './DatabaseDataActionDecorator';
import type { IDatabaseDataFormatAction } from './IDatabaseDataFormatAction';

@databaseDataAction()
export class ResultSetFormatAction implements IDatabaseDataFormatAction<IDatabaseResultSet> {
  static dataFormat = ResultDataFormat.Resultset;
  result: IDatabaseResultSet;

  constructor(result: IDatabaseResultSet) {
    this.result = result;
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

  updateResult(result: IDatabaseResultSet): void {
    this.result = result;
  }
}
