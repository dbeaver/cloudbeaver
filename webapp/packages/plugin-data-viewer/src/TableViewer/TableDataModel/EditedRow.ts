/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import type { TableRow, RowValues } from './TableRow';

export interface RowDiff {
  rowIndex: number;
  source: TableRow;
  values: RowValues;
}

export class EditedRow {
  readonly newRow: TableRow;
  private editedCells = new Set<number>();

  constructor(readonly rowIndex: number, readonly source: TableRow) {
    makeObservable<EditedRow, 'editedCells'>(this, {
      editedCells: observable,
    });

    this.newRow = [...source];
  }

  setValue(columnIndex: number, value: any) {
    if (this.source[columnIndex] !== value) {
      this.editedCells.add(columnIndex);
    } else {
      this.editedCells.delete(columnIndex);
    }

    this.newRow[columnIndex] = value;
    return this.newRow;
  }

  revert(columnIndex: number) {
    this.editedCells.delete(columnIndex);
    this.newRow[columnIndex] = this.source[columnIndex];

    return this.newRow;
  }

  isEdited(): boolean {
    return !!this.editedCells.size;
  }

  isCellEdited(columnIndex: number): boolean {
    return this.editedCells.has(columnIndex);
  }

  getDiff(): RowDiff {
    const values = Array.from(this.editedCells.keys())
      .reduce<RowValues>(
      (values, columnIndex) => ({
        ...values,
        [columnIndex]: this.newRow[columnIndex],
      }),
      {}
    );

    return {
      rowIndex: this.rowIndex,
      source: this.source,
      values,
    };
  }
}
