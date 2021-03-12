/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Executor, IExecutor } from '@cloudbeaver/core-executor';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import type { IDatabaseResultSet } from '../IDatabaseResultSet';
import { databaseDataAction } from './DatabaseDataActionDecorator';
import type { DatabaseDataEditorActionsData, IDatabaseDataSelectAction } from './IDatabaseDataSelectAction';

export interface IResultSetSelectKey {
  row: number;
  column?: number;
}

@databaseDataAction()
export class ResultSetSelectAction implements IDatabaseDataSelectAction<IResultSetSelectKey, IDatabaseResultSet> {
  static dataFormat = ResultDataFormat.Resultset;

  result: IDatabaseResultSet;

  readonly actions: IExecutor<DatabaseDataEditorActionsData<IResultSetSelectKey>>;
  private selectedElements: Map<number, number[]>;

  constructor(result: IDatabaseResultSet) {
    this.result = result;
    this.actions = new Executor();
    this.selectedElements = new Map();
  }

  updateResult(result: IDatabaseResultSet): void {
    this.result = result;
  }

  isSelected(): boolean {
    return this.selectedElements.size > 0;
  }

  isElementSelected(key: IResultSetSelectKey): boolean {
    const row = this.selectedElements.get(key.row);

    if (!row) {
      return false;
    }

    if (key.column !== undefined) {
      return row.includes(key.column);
    }

    return row.length === this.result.data?.columns?.length;
  }

  set(key: IResultSetSelectKey, selected: boolean): void {
    try {
      if (!this.selectedElements.has(key.row)) {
        if (!selected) {
          return;
        }
        this.selectedElements.set(key.row, []);
      }

      const columns = this.selectedElements.get(key.row)!;

      if (key.column) {
        if (selected) {
          if (!columns.includes(key.column)) {
            columns.push(key.column);
          }
        } else {
          const index = columns.indexOf(key.column);

          if (index >= 0) {
            columns.splice(index, 1);
          }

          if (columns.length === 0) {
            this.selectedElements.delete(key.row);
          }
        }
        return;
      }

      if (selected) {
        columns.push(...(this.result.data?.columns?.map((c, i) => i) || []));
      } else {
        this.selectedElements.delete(key.row);
      }
    } finally {
      this.actions.execute({
        type: 'select',
        resultId: this.result.id,
        key,
        selected,
      });
    }
  }

  clear(): void {
    this.actions.execute({
      type: 'clear',
      resultId: this.result.id,
    });
  }
}
