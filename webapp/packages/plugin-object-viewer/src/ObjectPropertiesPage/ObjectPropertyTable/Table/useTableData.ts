/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useObjectRef } from '@cloudbeaver/core-blocks';
import type { DBObject } from '@cloudbeaver/core-navigation-tree';
import type { CalculatedColumn as GridCalculatedColumn } from '@cloudbeaver/plugin-data-grid';

import type { ICustomColumn, IDataColumn } from './Column.js';

type CalculatedColumn = GridCalculatedColumn<DBObject>;

export interface ITableData {
  columns: IDataColumn[];
  isCustomColumn: (column: CalculatedColumn) => boolean;
  getColumnIdx: (column: CalculatedColumn) => number;
}

export function useTableData(dataColumns: IDataColumn[], customColumns: ICustomColumn[]): ITableData {
  return useObjectRef(
    () => ({
      get columns() {
        return this.customColumns
          .slice()
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .concat(this.dataColumns);
      },
      isCustomColumn(column: CalculatedColumn) {
        return this.customColumns.some(c => c.key === column.key);
      },
      getColumnIdx(column: CalculatedColumn) {
        return this.isCustomColumn(column) ? column.idx : column.idx - this.customColumns.length;
      },
    }),
    { dataColumns, customColumns },
  );
}
