/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, it, expect } from 'vitest';

import type { IGridColumnKey, IGridDataKey, IGridRowKey } from '@cloudbeaver/plugin-data-viewer';

import type { ITableData } from '../../TableDataContext.js';
import { getBoundingBox, isCompleteRectangleSelected } from './boundingBox.js';

// Helper to create mock table data
function createMockTableData(rows: IGridRowKey[], columns: IGridColumnKey[]): ITableData {
  return {
    rows,
    getRow: (idx: number) => rows[idx],
    getRowIndexFromKey: (key: IGridRowKey) => rows.findIndex(r => r.index === key.index),
    getColumn: (idx: number) => (columns[idx] ? { key: columns[idx] } : undefined),
    getColumnIndexFromColumnKey: (key: IGridColumnKey) => columns.findIndex(c => c.index === key.index),
  } as unknown as ITableData;
}

// Helper to create grid keys
const createRowKey = (index: number): IGridRowKey => ({ index, subIndex: 0 });
const createColKey = (index: number): IGridColumnKey => ({ index });
const createDataKey = (rowIdx: number, colIdx: number): IGridDataKey => ({
  row: createRowKey(rowIdx),
  column: createColKey(colIdx),
});

describe('getBoundingBox', () => {
  const mockRows = [createRowKey(0), createRowKey(1), createRowKey(2)];
  const mockCols = [createColKey(0), createColKey(1), createColKey(2)];
  const tableData = createMockTableData(mockRows, mockCols);

  it('should return null for empty selection', () => {
    const result = getBoundingBox(new Map(), tableData);
    expect(result).toBeNull();
  });

  it('should return correct box for single cell', () => {
    const selectedCells = new Map([['0:0', [createDataKey(1, 1)]]]);
    const result = getBoundingBox(selectedCells, tableData);
    expect(result).toEqual({
      startRowIdx: 1,
      endRowIdx: 1,
      startColIdx: 1,
      endColIdx: 1,
      rows: 1,
      columns: 1,
    });
  });

  it('should return correct box for rectangular selection', () => {
    const selectedCells = new Map([
      ['0:0', [createDataKey(0, 0), createDataKey(0, 1)]],
      ['1:0', [createDataKey(1, 0), createDataKey(1, 1)]],
    ]);
    const result = getBoundingBox(selectedCells, tableData);
    expect(result).toEqual({
      startRowIdx: 0,
      endRowIdx: 1,
      startColIdx: 0,
      endColIdx: 1,
      rows: 2,
      columns: 2,
    });
  });
});

describe('isCompleteRectangle', () => {
  const mockRows = [createRowKey(0), createRowKey(1), createRowKey(2)];
  const mockCols = [createColKey(0), createColKey(1), createColKey(2)];
  const tableData = createMockTableData(mockRows, mockCols);

  it('should return false for empty selection', () => {
    const result = isCompleteRectangleSelected(new Map(), tableData);
    expect(result).toBe(false);
  });

  it('should return true for single cell', () => {
    const selectedCells = new Map([['0:0', [createDataKey(1, 1)]]]);
    const result = isCompleteRectangleSelected(selectedCells, tableData);
    expect(result).toBe(true);
  });

  it('should return true for complete 2x2 rectangle', () => {
    const selectedCells = new Map([
      ['0:0', [createDataKey(0, 0), createDataKey(0, 1)]],
      ['1:0', [createDataKey(1, 0), createDataKey(1, 1)]],
    ]);
    const result = isCompleteRectangleSelected(selectedCells, tableData);
    expect(result).toBe(true);
  });

  it('should return false for 2x2 box with one cell missing (hole)', () => {
    // Select 3 cells that form a 2x2 bounding box but with one cell missing
    const selectedCells = new Map([
      ['0:0', [createDataKey(0, 0), createDataKey(0, 1)]],
      ['1:0', [createDataKey(1, 0)]], // Missing (1, 1)
    ]);
    const result = isCompleteRectangleSelected(selectedCells, tableData);
    expect(result).toBe(false);
  });

  it('should return false for 3x3 box with middle cell missing', () => {
    // Select 8 cells that form a 3x3 bounding box but with center cell missing
    const selectedCells = new Map([
      ['0:0', [createDataKey(0, 0), createDataKey(0, 1), createDataKey(0, 2)]],
      ['1:0', [createDataKey(1, 0), createDataKey(1, 2)]], // Missing (1, 1) - center
      ['2:0', [createDataKey(2, 0), createDataKey(2, 1), createDataKey(2, 2)]],
    ]);
    const result = isCompleteRectangleSelected(selectedCells, tableData);
    expect(result).toBe(false);
  });

  it('should return false for non-contiguous selection (two separate cells)', () => {
    // Two cells at corners - bounding box is 3x3 but only 2 cells selected
    const selectedCells = new Map([
      ['0:0', [createDataKey(0, 0)]],
      ['2:0', [createDataKey(2, 2)]],
    ]);
    const result = isCompleteRectangleSelected(selectedCells, tableData);
    expect(result).toBe(false);
  });

  it('should return true for complete 3x1 row selection', () => {
    const selectedCells = new Map([['0:0', [createDataKey(0, 0), createDataKey(0, 1), createDataKey(0, 2)]]]);
    const result = isCompleteRectangleSelected(selectedCells, tableData);
    expect(result).toBe(true);
  });

  it('should return true for complete 1x3 column selection', () => {
    const selectedCells = new Map([
      ['0:0', [createDataKey(0, 1)]],
      ['1:0', [createDataKey(1, 1)]],
      ['2:0', [createDataKey(2, 1)]],
    ]);
    const result = isCompleteRectangleSelected(selectedCells, tableData);
    expect(result).toBe(true);
  });
});
