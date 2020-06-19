/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { TableRow, RowValues } from './TableRow';

export type RowDiff = {
  rowIndex: number;
  source: TableRow;
  values: RowValues;
}

export class EditedRow {
  private newRow: TableRow
  private editedCells = new Set<number>()

  constructor(readonly rowIndex: number, readonly source: TableRow) {
    this.newRow = [...source];
  }

  setValue(columnIndex: number, value: any) {

    if (this.newRow[columnIndex] !== value) {
      this.editedCells.add(columnIndex);
    } else {
      this.editedCells.delete(columnIndex);
    }

    this.newRow[columnIndex] = value;
  }

  isEdited(): boolean {
    return !!this.editedCells.size;
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
