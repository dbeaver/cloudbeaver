/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, it, expect, vi } from 'vitest';

import { formatCellValueForClipboard } from './formatters.js';
import { NULL_SENTINEL } from '../constants/nullSentinel.js';
import type { ITableData } from '../../TableDataContext.js';
import type { IGridDataKey } from '@cloudbeaver/plugin-data-viewer';

// Mock tableData
const createMockTableData = (fullText?: string): ITableData =>
  ({
    dataContent: {
      retrieveFullTextFromCache: vi.fn(() => fullText ?? null),
    },
  }) as unknown as ITableData;

const createKey = (): IGridDataKey => ({
  row: { index: 0, subIndex: 0 },
  column: { index: 0 },
});

describe('formatCellValueForClipboard', () => {
  describe('null values', () => {
    it('should return NULL_SENTINEL for null', () => {
      const result = formatCellValueForClipboard({
        tableData: createMockTableData(),
        key: createKey(),
        value: null,
      });
      expect(result).toBe(NULL_SENTINEL);
    });
  });

  describe('primitive values', () => {
    it('should format boolean true', () => {
      const result = formatCellValueForClipboard({
        tableData: createMockTableData(),
        key: createKey(),
        value: true,
      });
      expect(result).toBe('true');
    });

    it('should format boolean false', () => {
      const result = formatCellValueForClipboard({
        tableData: createMockTableData(),
        key: createKey(),
        value: false,
      });
      expect(result).toBe('false');
    });

    it('should format numbers', () => {
      const result = formatCellValueForClipboard({
        tableData: createMockTableData(),
        key: createKey(),
        value: 42.5,
      });
      expect(result).toBe('42.5');
    });

    it('should format strings as-is', () => {
      const result = formatCellValueForClipboard({
        tableData: createMockTableData(),
        key: createKey(),
        value: 'hello world',
      });
      expect(result).toBe('hello world');
    });

    it('should handle empty strings', () => {
      const result = formatCellValueForClipboard({
        tableData: createMockTableData(),
        key: createKey(),
        value: '',
      });
      expect(result).toBe('');
    });
  });

  describe('complex values', () => {
    it('should stringify objects', () => {
      const result = formatCellValueForClipboard({
        tableData: createMockTableData(),
        key: createKey(),
        value: { foo: 'bar' },
      });
      expect(result).toBe('{"foo":"bar"}');
    });

    it('should stringify arrays', () => {
      const result = formatCellValueForClipboard({
        tableData: createMockTableData(),
        key: createKey(),
        value: [1, 2, 3],
      });
      expect(result).toBe('[1,2,3]');
    });
  });

  describe('content values', () => {
    it('should use cached full text when available', () => {
      const result = formatCellValueForClipboard({
        tableData: createMockTableData('full cached text'),
        key: createKey(),
        value: { $type: 'content', text: 'short' },
      });
      expect(result).toBe('full cached text');
    });

    it('should use binary field when no cached text', () => {
      const result = formatCellValueForClipboard({
        tableData: createMockTableData(),
        key: createKey(),
        value: { $type: 'content', binary: 'base64data' },
      });
      expect(result).toBe('base64data');
    });

    it('should use text field as fallback', () => {
      const result = formatCellValueForClipboard({
        tableData: createMockTableData(),
        key: createKey(),
        value: { $type: 'content', text: 'display text' },
      });
      expect(result).toBe('display text');
    });
  });

  describe('fallback', () => {
    it('should convert undefined to string', () => {
      const result = formatCellValueForClipboard({
        tableData: createMockTableData(),
        key: createKey(),
        value: undefined,
      });
      expect(result).toBe('undefined');
    });
  });
});
