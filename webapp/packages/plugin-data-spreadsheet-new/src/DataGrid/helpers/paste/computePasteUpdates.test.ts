/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, it, expect, vi } from 'vitest';

// Mock the plugin to prevent side effects from module initialization
vi.mock('@cloudbeaver/plugin-data-viewer', () => ({
  isStringifiedBoolean: (value: string) => /^(true|false)$/i.test(value),
}));

import { computePasteUpdates } from './computePasteUpdates.js';
import type { ITableData } from '../../TableDataContext.js';
import type { IGridColumnKey, IGridDataKey, IGridRowKey } from '@cloudbeaver/plugin-data-viewer';

// Helper to create mock table data
function createMockTableData(rows: IGridRowKey[], columns: IGridColumnKey[]): ITableData {
  return {
    rows,
    getRow: (idx: number) => rows[idx],
    getRowIndexFromKey: (key: IGridRowKey) => rows.findIndex(r => r.index === key.index),
    getColumn: (idx: number) => (columns[idx] ? { key: columns[idx] } : undefined),
    getColumnIndexFromColumnKey: (key: IGridColumnKey) => columns.findIndex(c => c.index === key.index),
    getColumnInfo: () => null,
  } as unknown as ITableData;
}

// Helper to create grid keys
const createRowKey = (index: number): IGridRowKey => ({ index, subIndex: 0 });
const createColKey = (index: number): IGridColumnKey => ({ index });
const createDataKey = (rowIdx: number, colIdx: number): IGridDataKey => ({
  row: createRowKey(rowIdx),
  column: createColKey(colIdx),
});

describe('computePasteUpdates', () => {
  const mockRows = [createRowKey(0), createRowKey(1), createRowKey(2)];
  const mockCols = [createColKey(0), createColKey(1), createColKey(2)];
  const tableData = createMockTableData(mockRows, mockCols);
  const visualColumnOrder = mockCols;
  const isCellEditable = () => true;

  describe('empty input', () => {
    it('should return empty array for empty grid', () => {
      const result = computePasteUpdates({
        pastedGrid: [],
        selectedCells: new Map(),
        focusedElement: null,
        tableData,
        visualColumnOrder,
        isCellEditable,
      });
      expect(result).toEqual([]);
    });

    it('should return empty array for grid with empty rows', () => {
      const result = computePasteUpdates({
        pastedGrid: [[]],
        selectedCells: new Map(),
        focusedElement: null,
        tableData,
        visualColumnOrder,
        isCellEditable,
      });
      expect(result).toEqual([]);
    });
  });

  describe('single cell to focused cell', () => {
    it('should paste single cell to focused cell', () => {
      const focusedElement = createDataKey(1, 1);
      const result = computePasteUpdates({
        pastedGrid: [['hello']],
        selectedCells: new Map(),
        focusedElement,
        tableData,
        visualColumnOrder,
        isCellEditable,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        key: { row: { index: 1 }, column: { index: 1 } },
        value: 'hello',
      });
    });

    it('should skip non-editable focused cell', () => {
      const focusedElement = createDataKey(1, 1);
      const result = computePasteUpdates({
        pastedGrid: [['hello']],
        selectedCells: new Map(),
        focusedElement,
        tableData,
        visualColumnOrder,
        isCellEditable: () => false,
      });

      expect(result).toEqual([]);
    });
  });

  describe('single cell to selection', () => {
    it('should paste same value to all selected cells', () => {
      const selectedCells = new Map([
        ['0:0', [createDataKey(0, 0), createDataKey(0, 1)]],
        ['1:0', [createDataKey(1, 0), createDataKey(1, 1)]],
      ]);

      const result = computePasteUpdates({
        pastedGrid: [['X']],
        selectedCells,
        focusedElement: null,
        tableData,
        visualColumnOrder,
        isCellEditable,
      });

      expect(result).toHaveLength(4);
      expect(result.every(u => u.value === 'X')).toBe(true);
    });
  });

  describe('grid to focused cell', () => {
    it('should paste grid starting at focused cell', () => {
      const focusedElement = createDataKey(0, 0);
      const result = computePasteUpdates({
        pastedGrid: [
          ['a', 'b'],
          ['c', 'd'],
        ],
        selectedCells: new Map(),
        focusedElement,
        tableData,
        visualColumnOrder,
        isCellEditable,
      });

      expect(result).toHaveLength(4);
      expect(result.map(u => u.value)).toEqual(['a', 'b', 'c', 'd']);
    });

    it('should clip grid to table bounds', () => {
      const focusedElement = createDataKey(2, 2); // Last row and column
      const result = computePasteUpdates({
        pastedGrid: [
          ['a', 'b'],
          ['c', 'd'],
        ],
        selectedCells: new Map(),
        focusedElement,
        tableData,
        visualColumnOrder,
        isCellEditable,
      });

      // Only (2,2) fits, so only 1 cell
      expect(result).toHaveLength(1);
      expect(result[0]?.value).toBe('a');
    });
  });

  describe('grid to selection', () => {
    it('should paste grid starting at focused element, clipped to selection size', () => {
      // Selection is 2x2 (rows 0-1, cols 0-1)
      const selectedCells = new Map([
        ['0:0', [createDataKey(0, 0), createDataKey(0, 1)]],
        ['1:0', [createDataKey(1, 0), createDataKey(1, 1)]],
      ]);
      const focusedElement = createDataKey(1, 1); // Focus is at (1,1)

      const result = computePasteUpdates({
        pastedGrid: [
          ['A', 'B', 'C'],
          ['D', 'E', 'F'],
          ['G', 'H', 'I'],
        ],
        selectedCells,
        focusedElement,
        tableData,
        visualColumnOrder,
        isCellEditable,
      });

      // Should start at focused element (1,1), clipped to selection size (2x2)
      // So only 2 rows and 2 columns are pasted
      expect(result).toHaveLength(4);
      expect(result.map(u => u.value)).toEqual(['A', 'B', 'D', 'E']);
      expect(result[0]).toMatchObject({
        key: { row: { index: 1 }, column: { index: 1 } },
      });
    });

    it('should paste grid clipped to selection bounds when no focused element', () => {
      const selectedCells = new Map([
        ['0:0', [createDataKey(0, 0), createDataKey(0, 1)]],
        ['1:0', [createDataKey(1, 0), createDataKey(1, 1)]],
      ]);

      const result = computePasteUpdates({
        pastedGrid: [
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
        ],
        selectedCells,
        focusedElement: null,
        tableData,
        visualColumnOrder,
        isCellEditable,
      });

      // Selection is 2x2, so only 4 values should be pasted
      expect(result).toHaveLength(4);
      expect(result.map(u => u.value)).toEqual(['1', '2', '4', '5']);
    });
  });

  describe('no target', () => {
    it('should return empty array when no selection and no focus', () => {
      const result = computePasteUpdates({
        pastedGrid: [['hello']],
        selectedCells: new Map(),
        focusedElement: null,
        tableData,
        visualColumnOrder,
        isCellEditable,
      });

      expect(result).toEqual([]);
    });
  });
});
