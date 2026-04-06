/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IGridColumnKey, IGridDataKey } from '@cloudbeaver/plugin-data-viewer';

import type { ITableData } from '../../TableDataContext.js';
import type { IVisualBoundingBox } from './types.js';

export function getVisualColumnIndex(colKey: IGridColumnKey, visualColumnOrder: IGridColumnKey[]): number {
  return visualColumnOrder.findIndex(k => k.index === colKey.index);
}

export function getVisualBoundingBox(
  selectedCells: Map<string, IGridDataKey[]>,
  tableData: ITableData,
  visualColumnOrder: IGridColumnKey[],
): IVisualBoundingBox | null {
  if (selectedCells.size === 0) {
    return null;
  }

  let minRowIdx = Infinity;
  let maxRowIdx = -Infinity;
  let minVisualColIdx = Infinity;
  let maxVisualColIdx = -Infinity;

  for (const cells of selectedCells.values()) {
    for (const cell of cells) {
      const rowIdx = tableData.getRowIndexFromKey(cell.row);
      const visualColIdx = getVisualColumnIndex(cell.column, visualColumnOrder);

      if (visualColIdx === -1) {
        continue;
      }

      if (rowIdx < minRowIdx) {
        minRowIdx = rowIdx;
      }
      if (rowIdx > maxRowIdx) {
        maxRowIdx = rowIdx;
      }
      if (visualColIdx < minVisualColIdx) {
        minVisualColIdx = visualColIdx;
      }
      if (visualColIdx > maxVisualColIdx) {
        maxVisualColIdx = visualColIdx;
      }
    }
  }

  if (minRowIdx === Infinity || minVisualColIdx === Infinity) {
    return null;
  }

  const startRow = tableData.getRow(minRowIdx);
  const startCol = visualColumnOrder[minVisualColIdx];

  if (!startRow || !startCol) {
    return null;
  }

  return {
    startRow,
    startCol,
    rows: maxRowIdx - minRowIdx + 1,
    columns: maxVisualColIdx - minVisualColIdx + 1,
  };
}
