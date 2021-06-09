/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { Executor, IExecutor } from '@cloudbeaver/core-executor';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DatabaseDataAction } from '../../DatabaseDataAction';
import type { IDatabaseDataSource } from '../../IDatabaseDataSource';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet';
import { databaseDataAction } from '../DatabaseDataActionDecorator';
import type { DatabaseDataSelectActionsData, IDatabaseDataSelectAction } from '../IDatabaseDataSelectAction';
import type { IResultSetElementKey } from './IResultSetElementKey';

@databaseDataAction()
export class ResultSetSelectAction extends DatabaseDataAction<any, IDatabaseResultSet>
  implements IDatabaseDataSelectAction<IResultSetElementKey, IDatabaseResultSet> {
  static dataFormat = ResultDataFormat.Resultset;

  readonly actions: IExecutor<DatabaseDataSelectActionsData<IResultSetElementKey>>;
  readonly selectedElements: Map<number, number[]>;

  private focusedElement: IResultSetElementKey | null;

  constructor(source: IDatabaseDataSource<any, IDatabaseResultSet>, result: IDatabaseResultSet) {
    super(source, result);
    this.actions = new Executor();
    this.selectedElements = new Map();
    this.focusedElement = null;

    makeObservable<ResultSetSelectAction, 'focusedElement'>(this, {
      selectedElements: observable,
      focusedElement: observable,
    });
  }

  isSelected(): boolean {
    return this.selectedElements.size > 0;
  }

  isElementSelected(key: IResultSetElementKey): boolean {
    if (key.row === undefined) {
      const rows = this.result.data?.rows?.length || 0;
      for (let row = 0; row < rows; row++) {
        if (!this.isElementSelected({ row, column: key.column })) {
          return false;
        }
      }

      return true;
    }

    const row = this.selectedElements.get(key.row);

    if (!row) {
      return false;
    }

    if (key.column !== undefined) {
      return row.includes(key.column);
    }

    return row.length === this.result.data?.columns?.length;
  }

  getFocusedElement(): IResultSetElementKey | null {
    return this.focusedElement;
  }

  getSelectedElements(): Array<Required<IResultSetElementKey>> {
    const selectedKeys: Array<Required<IResultSetElementKey>> = [];

    for (const [row, value] of this.selectedElements) {
      selectedKeys.push(...value.map(column => ({ row, column })));
    }

    return selectedKeys;
  }

  getRowSelection(row: number): number[] {
    return this.selectedElements.get(row) || [];
  }

  set(key: IResultSetElementKey, selected: boolean): void {
    if (key.row === undefined) {
      for (let row = 0; row < (this.result.data?.rows?.length || 0); row++) {
        this.set({ row, column: key.column }, selected);
      }

      return;
    }

    if (key.column === undefined) {
      for (let column = 0; column < (this.result.data?.columns?.length || 0); column++) {
        this.set({ row: key.row, column }, selected);
      }
      return;
    }

    try {
      if (!this.selectedElements.has(key.row)) {
        if (!selected) {
          return;
        }
        this.selectedElements.set(key.row, []);
      }

      const columns = this.selectedElements.get(key.row)!;

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
}
