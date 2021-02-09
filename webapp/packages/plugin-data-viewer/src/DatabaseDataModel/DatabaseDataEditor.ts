/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { DataUpdateType, IDatabaseDataEditor, IDatabaseDataResultEditor, IDataUpdate, IResultEditingDiff } from './IDatabaseDataEditor';
import type { IDatabaseDataResult } from './IDatabaseDataResult';

export class DatabaseDataEditor<TResult extends IDatabaseDataResult> implements IDatabaseDataEditor<TResult> {
  readonly editedResults: Map<string, IDataUpdate>;

  constructor() {
    makeObservable(this, {
      editedResults: observable,
    });

    this.editedResults = new Map();
  }

  /**
   * @deprecated more universal way should be implemented
   */
  isRowEdited(result: TResult, row: number): boolean {
    const update = this.editedResults.get(result.id);
    const diff = update?.diff.get(row);

    return !!diff?.source.some((value, index) => value !== diff.update[index]);
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

    return diff.source[column] !== diff.update[column];
  }

  getResultEditor(result: TResult): IDatabaseDataResultEditor {
    return {
      set: this.set.bind(this, result),
      setCell: this.setCell.bind(this, result),
      get: this.get.bind(this, result),
      getCell: this.get.bind(this, result),
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
  }

  /**
   * @deprecated more universal way should be implemented
   */
  setCell(result: TResult, row: number, column: number, value: any): void {
    const diff = this.getOrCreateDiff(result, row);

    diff.update[column] = value;
  }

  /**
   * @deprecated more universal way should be implemented
   */
  revert(result: TResult, row: number): void {
    const update = this.editedResults.get(result.id);

    if (update?.diff.has(row)) {
      update.diff.delete(row);
    }

    if (update?.diff.size === 0) {
      this.editedResults.delete(result.id);
    }
  }

  /**
   * @deprecated more universal way should be implemented
   */
  revertCell(result: TResult, row: number, column: number): void {
    const update = this.editedResults.get(result.id);
    const diff = update?.diff.get(row);

    if (diff) {
      diff.update[column] = diff?.source[column];
    }

    if (!this.isRowEdited(result, row)) {
      this.editedResults.delete(result.id);
    }
  }

  getChanges(): IDataUpdate[] {
    return Array.from(this.editedResults.values());
  }

  cancelResultChanges(result: TResult): void {
    this.editedResults.delete(result.id);
  }

  cancelChanges(): void {
    this.editedResults.clear();
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
