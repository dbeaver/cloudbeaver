/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export class RowSelection {
  columns = new Set<string>()
  constructor(readonly rowId: number) {}

  add(columnIndexList: string[]) {
    for (const columnId of columnIndexList) {
      this.columns.add(columnId);
    }
  }

  remove(columnIndexList: string[]) {
    for (const columnId of columnIndexList) {
      this.columns.delete(columnId);
    }
  }

  replace(columnIndexList: string[]) {
    this.columns.clear();
    this.add(columnIndexList);
  }

  isSelected(columnIndex: string) {
    return this.columns.has(columnIndex);
  }

  isRangeSelected(columnIndexList: string[]) {
    return columnIndexList.every(column => this.columns.has(column));
  }
}
