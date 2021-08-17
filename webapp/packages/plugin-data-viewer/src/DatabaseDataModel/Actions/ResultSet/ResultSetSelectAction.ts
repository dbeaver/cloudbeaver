/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable, observable } from 'mobx';

import { Executor, IExecutor } from '@cloudbeaver/core-executor';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DatabaseDataAction } from '../../DatabaseDataAction';
import type { IDatabaseDataSource } from '../../IDatabaseDataSource';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet';
import { databaseDataAction } from '../DatabaseDataActionDecorator';
import type { DatabaseDataSelectActionsData, IDatabaseDataSelectAction } from '../IDatabaseDataSelectAction';
import type { IResultSetColumnKey, IResultSetElementKey, IResultSetPartialKey, IResultSetRowKey } from './IResultSetDataKey';
import { ResultSetDataKeysUtils } from './ResultSetDataKeysUtils';
import { ResultSetViewAction } from './ResultSetViewAction';

@databaseDataAction()
export class ResultSetSelectAction extends DatabaseDataAction<any, IDatabaseResultSet>
  implements IDatabaseDataSelectAction<IResultSetPartialKey, IDatabaseResultSet> {
  static dataFormat = ResultDataFormat.Resultset;

  readonly actions: IExecutor<DatabaseDataSelectActionsData<IResultSetPartialKey>>;
  readonly selectedElements: Map<string, IResultSetElementKey[]>;

  private focusedElement: IResultSetElementKey | null;
  private data: ResultSetViewAction;

  get elements(): IResultSetElementKey[] {
    return Array.from(this.selectedElements.values()).flat();
  }

  constructor(source: IDatabaseDataSource<any, IDatabaseResultSet>, result: IDatabaseResultSet) {
    super(source, result);
    this.data = this.getAction(ResultSetViewAction);
    this.actions = new Executor();
    this.selectedElements = new Map();
    this.focusedElement = null;

    makeObservable<ResultSetSelectAction, 'focusedElement'>(this, {
      selectedElements: observable,
      focusedElement: observable,
      elements: computed,
    });
  }

  isSelected(): boolean {
    return this.selectedElements.size > 0;
  }

  isElementSelected(key: IResultSetPartialKey): boolean {
    if (key.row === undefined) {
      for (const row of this.data.rowKeys) {
        if (!this.isElementSelected({ row, column: key.column })) {
          return false;
        }
      }

      return true;
    }

    const row = this.selectedElements.get(ResultSetDataKeysUtils.serialize(key.row));

    if (!row) {
      return false;
    }

    if (key.column !== undefined) {
      return this.isColumnSelected(row, key.column);
    }

    return row.length === this.data.columnKeys.length;
  }

  getFocusedElement(): IResultSetElementKey | null {
    return this.focusedElement;
  }

  getRowSelection(row: IResultSetRowKey): IResultSetElementKey[] {
    return this.selectedElements.get(ResultSetDataKeysUtils.serialize(row)) || [];
  }

  set(key: IResultSetPartialKey, selected: boolean): void {
    if (key.row === undefined) {
      for (const row of this.data.rowKeys) {
        this.set({ row, column: key.column }, selected);
      }

      return;
    }

    if (key.column === undefined) {
      for (const column of this.data.columnKeys) {
        this.set({ row: key.row, column }, selected);
      }
      return;
    }

    try {
      if (!this.selectedElements.has(ResultSetDataKeysUtils.serialize(key.row))) {
        if (!selected) {
          return;
        }
        this.selectedElements.set(ResultSetDataKeysUtils.serialize(key.row), []);
      }

      const columns = this.selectedElements.get(ResultSetDataKeysUtils.serialize(key.row))!;

      if (selected) {
        if (!this.isColumnSelected(columns, key.column)) {
          columns.push(key as IResultSetElementKey);
        }
      } else {
        this.removeColumnSelection(columns, key.column);

        if (columns.length === 0) {
          this.selectedElements.delete(ResultSetDataKeysUtils.serialize(key.row));
        }
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

  focus(key: IResultSetElementKey | null): void {
    this.focusedElement = key;
  }

  clear(): void {
    this.selectedElements.clear();
    this.actions.execute({
      type: 'clear',
      resultId: this.result.id,
    });
  }

  private isColumnSelected(list: IResultSetElementKey[], key: IResultSetColumnKey) {
    return list.some(selected => ResultSetDataKeysUtils.isEqual(selected.column, key));
  }

  private removeColumnSelection(list: IResultSetElementKey[], key: IResultSetColumnKey) {
    const index = list.findIndex(selected => ResultSetDataKeysUtils.isEqual(selected.column, key));

    if (index >= 0) {
      list.splice(index, 1);
    }
  }
}
