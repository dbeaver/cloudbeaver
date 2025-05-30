/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test, beforeEach } from 'vitest';

import { TableEditor } from './TableEditor.js';
import type { ICellPosition } from './ICellPosition.js';

describe('TableEditor', () => {
  let tableEditor: TableEditor<string>;
  const initialData = [
    ['A1', 'B1', 'C1'],
    ['A2', 'B2', 'C2'],
    ['A3', 'B3', 'C3'],
  ];

  beforeEach(() => {
    tableEditor = new TableEditor(initialData);
  });

  describe('Basic functionality', () => {
    test('should initialize with provided data', () => {
      expect(tableEditor.rowCount).toBe(3);
      expect(tableEditor.data).toEqual(initialData);
      expect(tableEditor.isEdited).toBe(false);
    });

    test('should get cell values correctly', () => {
      const position: ICellPosition = { rowIdx: 1, colIdx: 1 };
      expect(tableEditor.getCellValue(position)).toBe('B2');
    });

    test('should return undefined for invalid positions', () => {
      const invalidPosition: ICellPosition = { rowIdx: 10, colIdx: 10 };
      expect(tableEditor.getCellValue(invalidPosition)).toBeUndefined();
    });
  });

  describe('Cell editing', () => {
    test('should set cell values and track changes', () => {
      const position: ICellPosition = { rowIdx: 1, colIdx: 1 };
      let changeCount = 0;
      
      tableEditor.on('data-changed', () => {
        changeCount++;
      });

      tableEditor.setCellValue(position, 'NEW_VALUE');

      expect(tableEditor.getCellValue(position)).toBe('NEW_VALUE');
      expect(tableEditor.isEdited).toBe(true);
      expect(changeCount).toBe(1);
    });

    test('should not emit events when setting same value', () => {
      const position: ICellPosition = { rowIdx: 1, colIdx: 1 };
      let changeCount = 0;
      
      tableEditor.on('data-changed', () => {
        changeCount++;
      });

      tableEditor.setCellValue(position, 'B2'); // Same value

      expect(changeCount).toBe(0);
      expect(tableEditor.isEdited).toBe(false);
    });

    test('should throw error for invalid positions', () => {
      const invalidPosition: ICellPosition = { rowIdx: 10, colIdx: 10 };
      
      expect(() => {
        tableEditor.setCellValue(invalidPosition, 'value');
      }).toThrow();
    });
  });

  describe('Row operations', () => {
    test('should insert rows correctly', () => {
      let changeCount = 0;
      tableEditor.on('data-changed', () => {
        changeCount++;
      });

      tableEditor.insertRow(1, ['X1', 'X2', 'X3']);

      expect(tableEditor.rowCount).toBe(4);
      expect(tableEditor.getCellValue({ rowIdx: 1, colIdx: 0 })).toBe('X1');
      expect(tableEditor.getCellValue({ rowIdx: 2, colIdx: 0 })).toBe('A2'); // Shifted down
      expect(tableEditor.isEdited).toBe(true);
      expect(changeCount).toBe(1);
    });

    test('should delete rows correctly', () => {
      let changeCount = 0;
      tableEditor.on('data-changed', () => {
        changeCount++;
      });

      tableEditor.deleteRow(1);

      expect(tableEditor.rowCount).toBe(2);
      expect(tableEditor.getCellValue({ rowIdx: 1, colIdx: 0 })).toBe('A3');
      expect(tableEditor.isEdited).toBe(true);
      expect(changeCount).toBe(1);
    });
  });

  describe('History management', () => {
    test('should support undo/redo for cell edits', () => {
      const position: ICellPosition = { rowIdx: 1, colIdx: 1 };
      
      // Make a change
      tableEditor.setCellValue(position, 'NEW_VALUE');
      expect(tableEditor.getCellValue(position)).toBe('NEW_VALUE');
      expect(tableEditor.history.canUndo).toBe(true);
      expect(tableEditor.history.canRedo).toBe(false);

      // Undo
      const undoResult = tableEditor.undo();
      expect(undoResult).toBe(true);
      expect(tableEditor.getCellValue(position)).toBe('B2');
      expect(tableEditor.history.canUndo).toBe(false);
      expect(tableEditor.history.canRedo).toBe(true);

      // Redo
      const redoResult = tableEditor.redo();
      expect(redoResult).toBe(true);
      expect(tableEditor.getCellValue(position)).toBe('NEW_VALUE');
      expect(tableEditor.history.canUndo).toBe(true);
      expect(tableEditor.history.canRedo).toBe(false);
    });

    test('should support undo/redo for row operations', () => {
      // Insert row
      tableEditor.insertRow(1, ['X1', 'X2', 'X3']);
      expect(tableEditor.rowCount).toBe(4);

      // Undo insert
      tableEditor.undo();
      expect(tableEditor.rowCount).toBe(3);
      expect(tableEditor.getCellValue({ rowIdx: 1, colIdx: 0 })).toBe('A2');

      // Redo insert
      tableEditor.redo();
      expect(tableEditor.rowCount).toBe(4);
      expect(tableEditor.getCellValue({ rowIdx: 1, colIdx: 0 })).toBe('X1');
    });

    test('should not fire change notifications for undo/redo operations', () => {
      let changeCount = 0;
      tableEditor.on('data-changed', () => {
        changeCount++;
      });

      const position: ICellPosition = { rowIdx: 1, colIdx: 1 };

      // Make a change - should fire change notification
      tableEditor.setCellValue(position, 'NEW_VALUE');
      expect(changeCount).toBe(1);

      // Undo - should NOT fire change notification
      tableEditor.undo();
      expect(changeCount).toBe(1);

      // Redo - should NOT fire change notification
      tableEditor.redo();
      expect(changeCount).toBe(1);
    });
  });

  describe('Data reset', () => {
    test('should reset data and clear history', () => {
      // Make some changes
      tableEditor.setCellValue({ rowIdx: 0, colIdx: 0 }, 'CHANGED');
      expect(tableEditor.isEdited).toBe(true);
      expect(tableEditor.history.canUndo).toBe(true);

      // Reset data
      const newData = [['Z1', 'Z2'], ['Z3', 'Z4']];
      tableEditor.resetData(newData);

      expect(tableEditor.data).toEqual(newData);
      expect(tableEditor.rowCount).toBe(2);
      expect(tableEditor.isEdited).toBe(false);
      expect(tableEditor.history.canUndo).toBe(false);
    });
  });
});
