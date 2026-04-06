/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IGridDataKey } from '@cloudbeaver/plugin-data-viewer';

import type { ITableData } from '../../TableDataContext.js';
import type { IBoundingBox } from './types.js';

/**
 * Extract bounding box from selected cells map.
 * Uses visual indices from tableData for correct column ordering.
 */
export function getBoundingBox(selectedCells: Map<string, IGridDataKey[]>, tableData: ITableData): IBoundingBox | null {
  if (selectedCells.size === 0) {
    return null;
  }

  let minRowIdx = Infinity;
  let maxRowIdx = -Infinity;
  let minColIdx = Infinity;
  let maxColIdx = -Infinity;

  for (const cells of selectedCells.values()) {
    for (const cell of cells) {
      const rowIdx = tableData.getRowIndexFromKey(cell.row);
      const colIdx = tableData.getColumnIndexFromColumnKey(cell.column);

      if (rowIdx < minRowIdx) {
        minRowIdx = rowIdx;
      }
      if (rowIdx > maxRowIdx) {
        maxRowIdx = rowIdx;
      }
      if (colIdx < minColIdx) {
        minColIdx = colIdx;
      }
      if (colIdx > maxColIdx) {
        maxColIdx = colIdx;
      }
    }
  }

  if (minRowIdx === Infinity) {
    return null;
  }

  return {
    startRowIdx: minRowIdx,
    endRowIdx: maxRowIdx,
    startColIdx: minColIdx,
    endColIdx: maxColIdx,
    rows: maxRowIdx - minRowIdx + 1,
    columns: maxColIdx - minColIdx + 1,
  };
}

/**
 * Check if the selection forms a complete rectangle (no holes).
 * Returns true if all cells within the bounding box are selected.
 */
export function isCompleteRectangleSelected(selectedCells: Map<string, IGridDataKey[]>, tableData: ITableData): boolean {
  const box = getBoundingBox(selectedCells, tableData);

  if (!box) {
    return false;
  }

  // Count actual selected cells
  let selectedCount = 0;
  for (const cells of selectedCells.values()) {
    selectedCount += cells.length;
  }

  // Expected count for a complete rectangle
  const expectedCount = box.rows * box.columns;

  return selectedCount === expectedCount;
}
