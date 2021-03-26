/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { IExecutor, Executor } from '@cloudbeaver/core-executor';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { databaseDataAction, IResultSetElementKey, IDatabaseResultSet, DatabaseDataEditorActionsData } from '@cloudbeaver/plugin-data-viewer';

import type { IDatabaseDataGISAction } from './IDatabaseDataGISAction';

@databaseDataAction()
export class ResultSetGISAction implements IDatabaseDataGISAction<IResultSetElementKey, IDatabaseResultSet> {
  GISValueType = 'geometry';

  static dataFormat = ResultDataFormat.Resultset;
  result: IDatabaseResultSet;

  readonly actions: IExecutor<DatabaseDataEditorActionsData<IResultSetElementKey>>;

  constructor(
    result: IDatabaseResultSet) {
    this.result = result;
    this.actions = new Executor();
  }

  isGISFormat(value: any): boolean {
    if (value !== null && typeof value === 'object' && '$type' in value) {
      return value.$type === this.GISValueType;
    }

    return false;
  }

  getGISDataFor(cells: Array<Required<IResultSetElementKey>>): Array<Required<IResultSetElementKey>> {
    const result: Array<Required<IResultSetElementKey>> = [];
    if (!this.result.data?.rows) {
      return result;
    }

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const cellValue = this.result.data?.rows[cell.row][cell.column];
      if (this.isGISFormat(cellValue)) {
        result.push(cell);
      }
    }
    return result;
  }

  updateResult(result: IDatabaseResultSet) {
    this.result = result;
  }
}
