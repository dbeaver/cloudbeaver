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
 * Uses actual row/column keys to correctly handle pinned and reordered columns.
 */
export function extractCellsFromRegion(params: IExtractFromRegionParams): IExtractedCells | null {
  const { region, getCellRawValue } = params;

  if (region.rowKeys.length === 0 || region.columnKeys.length === 0) {
    return null;
  }

  const cells: Array<Array<{ sourceKey: IGridDataKey; value: unknown }>> = [];

  for (const row of region.rowKeys) {
    const rowCells: Array<{ sourceKey: IGridDataKey; value: unknown }> = [];

    for (const colKey of region.columnKeys) {
      const key: IGridDataKey = { row, column: colKey };
      const value = getCellRawValue(key);
      rowCells.push({ sourceKey: key, value });
    }

    cells.push(rowCells);
  }

  if (cells.length === 0) {
    return null;
  }

  return { cells, columnKeys: region.columnKeys, rowKeys: region.rowKeys };
}

/**
 * Build a 2D grid of raw cell values from the selected cells bounding box.
 */
export function extractRegionCells(params: IExtractCellsParams): IExtractedCells | null {
  const { tableData, selectedCells, getCellRawValue } = params;

  const box = getBoundingBox(selectedCells, tableData);

  if (!box) {
    return null;
  }

  const rowKeys = [];
  const columnKeys = [];

  for (let rowIdx = box.startRowIdx; rowIdx <= box.endRowIdx; rowIdx++) {
    const row = tableData.getRow(rowIdx);
    if (row) {
      rowKeys.push(row);
    }
  }

  for (let colIdx = box.startColIdx; colIdx <= box.endColIdx; colIdx++) {
    const col = tableData.getColumn(colIdx);
    if (col?.key) {
      columnKeys.push(col.key);
    }
  }

  return extractCellsFromRegion({ region: { rowKeys, columnKeys }, getCellRawValue });
}
