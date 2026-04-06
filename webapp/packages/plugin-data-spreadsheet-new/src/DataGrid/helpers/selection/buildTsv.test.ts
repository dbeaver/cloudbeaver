/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, it, expect } from 'vitest';

import { buildTsvFromCells } from './buildTsv.js';

describe('buildTsvFromCells', () => {
  const identity = (v: string) => v;

  describe('basic formatting', () => {
    it('should return empty string for empty array', () => {
      expect(buildTsvFromCells([], identity)).toBe('');
    });

    it('should format single cell', () => {
      expect(buildTsvFromCells([['hello']], identity)).toBe('hello');
    });

    it('should join cells with tabs', () => {
      expect(buildTsvFromCells([['a', 'b', 'c']], identity)).toBe('a\tb\tc');
    });

    it('should join rows with CRLF', () => {
      expect(buildTsvFromCells([['a'], ['b'], ['c']], identity)).toBe('a\r\nb\r\nc');
    });

    it('should format grid correctly', () => {
      const grid = [
        ['a', 'b'],
        ['c', 'd'],
      ];
      expect(buildTsvFromCells(grid, identity)).toBe('a\tb\r\nc\td');
    });
  });

  describe('quoting', () => {
    it('should quote values containing tabs', () => {
      expect(buildTsvFromCells([['hello\tworld']], identity)).toBe('"hello\tworld"');
    });

    it('should quote values containing newlines', () => {
      expect(buildTsvFromCells([['hello\nworld']], identity)).toBe('"hello\nworld"');
    });

    it('should quote values containing carriage returns', () => {
      expect(buildTsvFromCells([['hello\rworld']], identity)).toBe('"hello\rworld"');
    });

    it('should escape quotes by doubling them', () => {
      expect(buildTsvFromCells([['say "hello"']], identity)).toBe('"say ""hello"""');
    });

    it('should handle values with both quotes and special chars', () => {
      expect(buildTsvFromCells([['say "hi"\tthere']], identity)).toBe('"say ""hi""\tthere"');
    });
  });

  describe('custom value getter', () => {
    interface Cell {
      value: string;
    }

    it('should use custom getter function', () => {
      const cells: Cell[][] = [[{ value: 'a' }, { value: 'b' }]];
      expect(buildTsvFromCells(cells, cell => cell.value)).toBe('a\tb');
    });

    it('should apply quoting after getter', () => {
      const cells: Cell[][] = [[{ value: 'hello\tworld' }]];
      expect(buildTsvFromCells(cells, cell => cell.value)).toBe('"hello\tworld"');
    });
  });
});
