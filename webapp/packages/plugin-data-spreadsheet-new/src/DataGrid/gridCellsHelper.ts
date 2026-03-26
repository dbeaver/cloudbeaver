/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { DatabaseEditChangeType, type IGridDataKey, isBooleanValuePresentationAvailable, getCellTextValue } from '@cloudbeaver/plugin-data-viewer';

import type { ITableData } from './TableDataContext.js';

export type CellUpdate = { key: IGridDataKey; value: string };

const COLUMN_SIGNATURE_SEPARATOR = ',';

export const GridCellsHelper = {
  sortRowsByIndex(rows: IGridDataKey[][], tableData: ITableData): IGridDataKey[][] {
    return rows.toSorted((a, b) => tableData.getRowIndexFromKey(a[0]!.row) - tableData.getRowIndexFromKey(b[0]!.row));
  },
  sortCellsByColumn(cells: IGridDataKey[], tableData: ITableData): IGridDataKey[] {
    return cells.toSorted((a, b) => tableData.getColumnIndexFromColumnKey(a.column) - tableData.getColumnIndexFromColumnKey(b.column));
  },
  getColumnSignature(row: IGridDataKey[], tableData: ITableData): string {
    return row.map(cell => tableData.getColumnIndexFromColumnKey(cell.column)).join(COLUMN_SIGNATURE_SEPARATOR);
  },
  isGridCellEditable(key: IGridDataKey, tableData: ITableData, hasElementIdentifier: boolean): boolean {
    const editionState = tableData.getEditionState(key);

    if (!hasElementIdentifier && editionState !== DatabaseEditChangeType.add) {
      return false;
    }

    const holder = tableData.getCellHolder(key);

    if (tableData.format.isBinary(holder) || tableData.format.isGeometry(holder) || tableData.dataContent.isTextTruncated(holder)) {
      return false;
    }

    const resultColumn = tableData.getColumnInfo(key.column);

    if (!resultColumn || holder.value === undefined) {
      return false;
    }

    return !(isBooleanValuePresentationAvailable(holder.value, resultColumn) || tableData.isCellReadonly(key));
  },
  getCellValue(tableData: ITableData, key: IGridDataKey): string {
    const holder = tableData.getCellHolder(key);
    return getCellTextValue(holder, tableData.format, tableData.dataContent);
  },
};
