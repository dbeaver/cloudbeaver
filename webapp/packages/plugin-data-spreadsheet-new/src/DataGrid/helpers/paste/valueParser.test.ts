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

import { parseValueForCell } from './valueParser.js';
import { NULL_SENTINEL } from '../constants/nullSentinel.js';
import type { ITableData } from '../../TableDataContext.js';
import type { IGridDataKey } from '@cloudbeaver/plugin-data-viewer';

// Mock tableData factory
const createMockTableData = (dataKind?: string): ITableData =>
  ({
    getColumnInfo: vi.fn(() => (dataKind ? { dataKind } : null)),
  }) as unknown as ITableData;

const createKey = (): IGridDataKey => ({
  row: { index: 0, subIndex: 0 },
  column: { index: 0 },
});

describe('parseValueForCell', () => {
  describe('null sentinel handling', () => {
    it('should return null for NULL_SENTINEL', () => {
      const result = parseValueForCell(NULL_SENTINEL, createKey(), createMockTableData());
      expect(result).toBeNull();
    });
  });

  describe('regular string values', () => {
    it('should return string as-is for non-boolean columns', () => {
      const result = parseValueForCell('hello', createKey(), createMockTableData('string'));
      expect(result).toBe('hello');
    });

    it('should return empty string as-is', () => {
      const result = parseValueForCell('', createKey(), createMockTableData());
      expect(result).toBe('');
    });

    it('should handle numeric strings', () => {
      const result = parseValueForCell('123.45', createKey(), createMockTableData('number'));
      expect(result).toBe('123.45');
    });
  });

  describe('boolean column validation', () => {
    it('should accept lowercase true for boolean columns', () => {
      const result = parseValueForCell('true', createKey(), createMockTableData('boolean'));
      expect(result).toBe('true');
    });

    it('should accept lowercase false for boolean columns', () => {
      const result = parseValueForCell('false', createKey(), createMockTableData('boolean'));
      expect(result).toBe('false');
    });

    it('should accept uppercase TRUE for boolean columns', () => {
      const result = parseValueForCell('TRUE', createKey(), createMockTableData('boolean'));
      expect(result).toBe('TRUE');
    });

    it('should accept uppercase FALSE for boolean columns', () => {
      const result = parseValueForCell('FALSE', createKey(), createMockTableData('boolean'));
      expect(result).toBe('FALSE');
    });

    it('should accept mixed case True for boolean columns', () => {
      const result = parseValueForCell('True', createKey(), createMockTableData('boolean'));
      expect(result).toBe('True');
    });

    it('should reject invalid values for boolean columns', () => {
      const result = parseValueForCell('yes', createKey(), createMockTableData('boolean'));
      expect(result).toBeUndefined();
    });

    it('should reject numeric strings for boolean columns', () => {
      const result = parseValueForCell('1', createKey(), createMockTableData('boolean'));
      expect(result).toBeUndefined();
    });

    it('should reject empty string for boolean columns', () => {
      const result = parseValueForCell('', createKey(), createMockTableData('boolean'));
      expect(result).toBeUndefined();
    });
  });

  describe('column info edge cases', () => {
    it('should handle missing column info', () => {
      const tableData = {
        getColumnInfo: vi.fn(() => null),
      } as unknown as ITableData;
      const result = parseValueForCell('hello', createKey(), tableData);
      expect(result).toBe('hello');
    });

    it('should handle column with no dataKind', () => {
      const tableData = {
        getColumnInfo: vi.fn(() => ({})),
      } as unknown as ITableData;
      const result = parseValueForCell('hello', createKey(), tableData);
      expect(result).toBe('hello');
    });
  });
});
