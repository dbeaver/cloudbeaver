/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export class RowSelection {
  columns = new Set<number>()
  constructor(readonly rowId: number) {}

  add(columnIndexList: number[]) {
    for (const columnId of columnIndexList) {
      this.columns.add(columnId);
    }
  }

  remove(columnIndexList: number[]) {
    for (const columnId of columnIndexList) {
      this.columns.delete(columnId);
    }
  }

  replace(columnIndexList: number[]) {
    this.columns.clear();
    this.add(columnIndexList);
  }

  isSelected(columnIndex: number) {
    return this.columns.has(columnIndex);
  }

  isRangeSelected(columnIndexList: number[]) {
    return columnIndexList.every(column => this.columns.has(column));
  }
}
