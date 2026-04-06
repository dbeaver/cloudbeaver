/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, it, expect } from 'vitest';

import { parseTsv } from './parseTsv.js';

describe('parseTsv', () => {
  describe('basic parsing', () => {
    it('should return empty array for empty string', () => {
      expect(parseTsv('')).toEqual([]);
    });

    it('should return empty array for null-like input', () => {
      expect(parseTsv(undefined as any)).toEqual([]);
    });

    it('should parse single cell', () => {
      expect(parseTsv('hello')).toEqual([['hello']]);
    });

    it('should parse single row with multiple cells', () => {
      expect(parseTsv('a\tb\tc')).toEqual([['a', 'b', 'c']]);
    });

    it('should parse multiple rows', () => {
      expect(parseTsv('a\tb\nc\td')).toEqual([
        ['a', 'b'],
        ['c', 'd'],
      ]);
    });
  });

  describe('line endings', () => {
    it('should handle LF line endings', () => {
      expect(parseTsv('a\nb\nc')).toEqual([['a'], ['b'], ['c']]);
    });

    it('should handle CRLF line endings', () => {
      expect(parseTsv('a\r\nb\r\nc')).toEqual([['a'], ['b'], ['c']]);
    });

    it('should handle mixed line endings', () => {
      expect(parseTsv('a\nb\r\nc')).toEqual([['a'], ['b'], ['c']]);
    });
  });

  describe('quoted fields', () => {
    it('should parse quoted field', () => {
      expect(parseTsv('"hello"')).toEqual([['hello']]);
    });

    it('should preserve tabs inside quoted fields', () => {
      expect(parseTsv('"hello\tworld"')).toEqual([['hello\tworld']]);
    });

    it('should preserve newlines inside quoted fields', () => {
      expect(parseTsv('"hello\nworld"')).toEqual([['hello\nworld']]);
    });

    it('should handle escaped quotes (doubled)', () => {
      expect(parseTsv('"say ""hello"""')).toEqual([['say "hello"']]);
    });

    it('should handle quoted field with CRLF inside', () => {
      expect(parseTsv('"line1\r\nline2"')).toEqual([['line1\r\nline2']]);
    });

    it('should handle multiple quoted fields in a row', () => {
      expect(parseTsv('"a"\t"b"\t"c"')).toEqual([['a', 'b', 'c']]);
    });

    it('should handle mixed quoted and unquoted fields', () => {
      expect(parseTsv('a\t"b\tc"\td')).toEqual([['a', 'b\tc', 'd']]);
    });
  });

  describe('edge cases', () => {
    it('should handle empty cells', () => {
      expect(parseTsv('a\t\tc')).toEqual([['a', '', 'c']]);
    });

    it('should handle trailing tab', () => {
      expect(parseTsv('a\tb\t')).toEqual([['a', 'b', '']]);
    });

    it('should skip empty rows', () => {
      expect(parseTsv('a\n\nb')).toEqual([['a'], ['b']]);
    });

    it('should handle whitespace-only content', () => {
      expect(parseTsv('   \t   ')).toEqual([['   ', '   ']]);
    });

    it('should handle unicode characters', () => {
      expect(parseTsv('héllo\tмир\t世界')).toEqual([['héllo', 'мир', '世界']]);
    });

    it('should handle complex multi-row data', () => {
      const input = 'name\tage\tcity\r\n"John ""Johnny"" Doe"\t30\t"New York"\r\nJane\t25\tBoston';
      expect(parseTsv(input)).toEqual([
        ['name', 'age', 'city'],
        ['John "Johnny" Doe', '30', 'New York'],
        ['Jane', '25', 'Boston'],
      ]);
    });
  });
});
