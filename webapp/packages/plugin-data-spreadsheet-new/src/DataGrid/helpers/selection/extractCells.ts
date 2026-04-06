/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IGridDataKey } from '@cloudbeaver/plugin-data-viewer';

import { getBoundingBox } from './boundingBox.js';
import type { IExtractCellsParams, IExtractedCells, IExtractFromRegionParams } from './types.js';

/**
 * Build a 2D grid of raw cell values from the last selection region.
 * Always uses visual column order to correctly handle pinned and reordered columns.
 */
export function extractCellsFromRegion(params: IExtractFromRegionParams): IExtractedCells | null {
  const { region, getCellRawValue, visualColumnOrder } = params;

  if (region.rowKeys.length === 0 || region.columnKeys.length === 0) {
    return null;
  }

  // Get the set of column indices from the region
  const regionColIndices = new Set(region.columnKeys.map(col => col.index));

  // Reorder columns based on visual order, keeping only those in the region
  const orderedColumnKeys = visualColumnOrder.filter(col => regionColIndices.has(col.index));

  if (orderedColumnKeys.length === 0) {
    return null;
  }

  const cells: Array<Array<{ sourceKey: IGridDataKey; value: unknown }>> = [];

  for (const row of region.rowKeys) {
    const rowCells: Array<{ sourceKey: IGridDataKey; value: unknown }> = [];

    for (const colKey of orderedColumnKeys) {
      const key: IGridDataKey = { row, column: colKey };
      const value = getCellRawValue(key);
      rowCells.push({ sourceKey: key, value });
    }

    cells.push(rowCells);
  }

  if (cells.length === 0) {
    return null;
  }

  return { cells, columnKeys: orderedColumnKeys, rowKeys: region.rowKeys };
}

/**
 * Build a 2D grid of raw cell values from the selected cells bounding box.
 * Always uses visual column order to respect pinned/reordered columns.
 */
export function extractRegionCells(params: IExtractCellsParams): IExtractedCells | null {
  const { tableData, selectedCells, getCellRawValue, visualColumnOrder } = params;

  const box = getBoundingBox(selectedCells, tableData);

  if (!box) {
    return null;
  }

  const rowKeys = [];

  for (let rowIdx = box.startRowIdx; rowIdx <= box.endRowIdx; rowIdx++) {
    const row = tableData.getRow(rowIdx);
    if (row) {
      rowKeys.push(row);
    }
  }

  // Find selected column indices
  const selectedColIndices = new Set<number>();
  for (const cells of selectedCells.values()) {
    for (const cell of cells) {
      selectedColIndices.add(cell.column.index);
    }
  }

  // Filter visual column order to only include selected columns, preserving visual order
  const columnKeys = visualColumnOrder.filter(col => selectedColIndices.has(col.index));

  return extractCellsFromRegion({ region: { rowKeys, columnKeys }, getCellRawValue, visualColumnOrder });
}
