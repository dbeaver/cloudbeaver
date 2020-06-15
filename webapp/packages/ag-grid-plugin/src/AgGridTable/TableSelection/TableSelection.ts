/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { RowSelection } from './RowSelection';

export class TableSelection {
  private selectedMap = new Map<number, RowSelection>()

  getSelectedRows(): RowSelection[] {
    return Array
      .from(this.selectedMap.keys())
      .sort((a, b) => a - b)
      .map(rowId => this.selectedMap.get(rowId)!);
  }

  clear() {
    this.selectedMap.clear();
  }

  selectCell(rowId: number, columnId: string, isMultiple: boolean, ignoreSelected = false) {
    if (!isMultiple) {
      this.clear();
    }

    const rowSelection = this.selectedMap.get(rowId);

    if (!ignoreSelected && rowSelection?.isSelected(columnId)) {
      this.unselectColumn(
        this.selectedMap,
        rowSelection,
        [columnId]
      );
    } else {
      this.selectColumn(rowId, rowSelection, [columnId]);
    }
  }

  selectRange(
    startPosition: number,
    endPosition: number,
    columns: string[],
    isMultiple: boolean
  ) {
    const firstRow = Math.min(startPosition, endPosition);
    const lastRow = Math.max(startPosition, endPosition);
    const isSelected = this.isRangeSelected(firstRow, lastRow, columns);

    if (!isMultiple) {
      this.clear();
    }

    for (let rowId = firstRow; rowId <= lastRow; rowId++) {
      const rowSelection = this.selectedMap.get(rowId);
      if (isSelected) {
        if (rowSelection) {
          this.unselectColumn(
            this.selectedMap,
            rowSelection,
            columns
          );
        }
      } else {
        this.selectColumn(rowId, rowSelection, columns);
      }
    }
  }

  isCellSelected(rowId: number, columnId: string): boolean {
    const current = this.selectedMap.get(rowId);

    return current?.isSelected(columnId) || false;
  }

  isRangeSelected(startPosition: number, endPosition: number, columns: string[]): boolean {
    const start = Math.min(startPosition, endPosition);
    const end = Math.max(startPosition, endPosition);

    for (let rowId = start; rowId <= end; rowId++) {
      const rowSelection = this.selectedMap.get(rowId);
      if (!rowSelection?.isRangeSelected(columns)) {
        return false;
      }
    }
    return true;
  }

  private unselectColumn(source: Map<number, RowSelection>, rowSelection: RowSelection, columns: string[]) {
    rowSelection.remove(columns);
    if (rowSelection.columns.size === 0) {
      source.delete(rowSelection.rowId);
    }
  }

  private selectColumn(rowId: number, rowSelection: RowSelection | undefined = undefined, columns: string[]) {
    if (!rowSelection) {
      rowSelection = new RowSelection(rowId);
      this.selectedMap.set(rowId, rowSelection);
    }

    rowSelection.add(columns);
  }
}
