/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { Executor, IExecutor } from '@cloudbeaver/core-executor';

import { isResultSetContentValue } from './Actions/ResultSet/isResultSetContentValue';
import { DataUpdateType, IDatabaseDataEditor, IDatabaseDataEditorActionsData, IDatabaseDataResultEditor, IDataUpdate, IResultEditingDiff } from './IDatabaseDataEditor';
import type { IDatabaseDataResult } from './IDatabaseDataResult';

export class DatabaseDataEditor<TResult extends IDatabaseDataResult> implements IDatabaseDataEditor<TResult> {
  readonly editedResults: Map<string, IDataUpdate>;
  readonly actions: IExecutor<IDatabaseDataEditorActionsData>;

  constructor() {
    makeObservable(this, {
      editedResults: observable,
    });

    this.editedResults = new Map();
    this.actions = new Executor();
  }

  /**
   * @deprecated more universal way should be implemented
   */
  isRowEdited(result: TResult, row: number): boolean {
    const update = this.editedResults.get(result.id);
    const diff = update?.diff.get(row);

    return !!diff?.source.some((value, index) => !this.compareCellValue(value, diff.update[index]));
  }

  isResultEdited(result: TResult): boolean {
    return this.editedResults.has(result.id);
  }

  /**
   * @deprecated more universal way should be implemented
   */
  isCellEdited(result: TResult, row: number, column: number): boolean {
    const update = this.editedResults.get(result.id);
    const diff = update?.diff.get(row);

    if (!update || !diff) {
      return false;
    }

    return !this.compareCellValue(diff.source[column], diff.update[column]);
  }

  getResultEditor(result: TResult): IDatabaseDataResultEditor<TResult> {
    return {
      result,
      set: this.set.bind(this, result),
      setCell: this.setCell.bind(this, result),
      get: this.get.bind(this, result),
      getCell: this.getCell.bind(this, result),
      isCellEdited: this.isCellEdited.bind(this, result),
      isEdited: this.isResultEdited.bind(this, result),
      isRowEdited: this.isRowEdited.bind(this, result),
      revert: this.revert.bind(this, result),
      revertCell: this.revertCell.bind(this, result),
      cancelChanges: this.cancelChanges.bind(this, result),
    };
  }

  /**
   * @deprecated more universal way should be implemented
   */
  get(result: TResult, row: number): any {
    const update = this.editedResults.get(result.id);
    const diff = update?.diff.get(row);

    if (!update || !diff) {
      return result.data.rows[row];
    }

    return diff?.update;
  }

  /**
   * @deprecated more universal way should be implemented
   */
  getCell(result: TResult, row: number, column: number): any {
    const update = this.editedResults.get(result.id);
    const diff = update?.diff.get(row);

    if (!update || !diff) {
      return result.data.rows[row][column];
    }

    return diff?.update[column];
  }

  /**
   * @deprecated more universal way should be implemented
   */
  set(result: TResult, row: number, value: any): void {
    const diff = this.getOrCreateDiff(result, row);

    diff.update = value;

    let column = 0;
    for (const value of diff.update) {
      this.actions.execute({
        type: 'edit',
        resultId: result.id,
        column,
        row,
        value,
        prevValue: diff.source[column],
      });
      column++;
    }

    this.removeUnchangedRow(result, row);
  }

  /**
   * @deprecated more universal way should be implemented
   */
  setCell(result: TResult, row: number, column: number, value: any): void {
    const diff = this.getOrCreateDiff(result, row);
    const prevValue = diff.source[column];

    if (isResultSetContentValue(prevValue) && value !== null) {
      if ('text' in prevValue) {
        value = {
          ...prevValue,
          text: String(value),
          contentLength: String(value).length,
        };
      }
    }

    diff.update[column] = value;

    this.actions.execute({
      type: 'edit',
      resultId: result.id,
      column,
      row,
      value,
      prevValue: diff.source[column],
    });

    this.removeUnchangedRow(result, row);
  }

  /**
   * @deprecated more universal way should be implemented
   */
  revert(result: TResult, row: number): void {
    const update = this.editedResults.get(result.id);

    if (update?.diff.has(row)) {
      const diff = update.diff.get(row)!;

      let column = 0;
      for (const value of diff.source) {
        this.actions.execute({
          type: 'cancel',
          resultId: result.id,
          column,
          row,
          value,
          prevValue: diff.update[column],
        });
        column++;
      }

      update.diff.delete(row);
    }

    this.removeUnchangedRow(result, row);
  }

  /**
   * @deprecated more universal way should be implemented
   */
  revertCell(result: TResult, row: number, column: number): void {
    const update = this.editedResults.get(result.id);
    const diff = update?.diff.get(row);

    if (diff) {
      const prevValue = diff.update[column];
      const value = diff?.source[column];
      diff.update[column] = value;

      this.actions.execute({
        type: 'cancel',
        resultId: result.id,
        column,
        row,
        value,
        prevValue,
      });
    }

    this.removeUnchangedRow(result, row);
  }

  getChanges(format?: boolean): IDataUpdate[] {
    if (format) {
      this.formatResults();
    }
    return Array.from(this.editedResults.values());
  }

  formatChanges(): this {
    this.formatResults();
    return this;
  }

  cancelResultChanges(result: TResult): void {
    for (const update of this.getChanges()) {
      for (const [row, diff] of update.diff) {
        let column = 0;
        for (const value of diff.source) {
          this.actions.execute({
            type: 'cancel',
            resultId: result.id,
            column,
            row,
            value,
            prevValue: diff.update[column],
          });
          column++;
        }
      }
    }
    this.editedResults.delete(result.id);
  }

  cancelChanges(): void {
    for (const update of this.getChanges()) {
      for (const [row, diff] of update.diff) {
        let column = 0;
        for (const value of diff.source) {
          this.actions.execute({
            type: 'cancel',
            resultId: update.resultId,
            column,
            row,
            value,
            prevValue: diff.update[column],
          });
          column++;
        }
      }
    }
    this.editedResults.clear();
  }

  private formatResults() {
    for (const update of this.editedResults.values()) {
      for (const [row, diff] of update.diff) {
        let column = 0;
        for (const value of diff.source) {
          if (typeof value === 'number') {
            let value = diff.update[column];

            if (typeof value === 'string') {
              value = value.replace(',', '.');
            }

            diff.update[column] = Number(value);
          }
          column++;
        }
      }
    }
  }

  private removeUnchangedRow(result: TResult, row: number) {
    const update = this.editedResults.get(result.id);

    if (!this.isRowEdited(result, row)) {
      update?.diff.delete(row);

      if (update?.diff.size === 0) {
        this.editedResults.delete(result.id);
      }
    }
  }

  private compareCellValue(valueA: any, valueB: any) {
    valueA = valueA === undefined ? '' : valueA;
    valueB = valueB === undefined ? '' : valueB;

    if (typeof valueA === 'number' || typeof valueB === 'number') {
      return String(valueA) === String(valueB);
    }

    if (typeof valueA === 'boolean' || typeof valueB === 'boolean') {
      return String(valueA).toLowerCase() === String(valueB).toLowerCase();
    }

    if (isResultSetContentValue(valueA) && isResultSetContentValue(valueB)) {
      if ('text' in valueA && 'text' in valueB) {
        return valueA.text === valueB.text;
      }
    }

    return valueA === valueB;
  }

  private getOrCreateUpdate(resultId: string): IDataUpdate {
    if (!this.editedResults.has(resultId)) {
      this.editedResults.set(resultId, { diff: new Map(), resultId });
    }

    return this.editedResults.get(resultId)!;
  }

  private getOrCreateDiff(result: TResult, row: number): IResultEditingDiff {
    const update = this.getOrCreateUpdate(result.id);

    if (!update.diff.has(row)) {
      const source = result.data.rows[row];
      update.diff.set(row, {
        type: DataUpdateType.update,
        source,
        update: [...source],
      });
    }

    return update.diff.get(row)!;
  }
}
