/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test } from 'vitest';

import { formatNumber } from './formatNumber.js';

describe('formatNumber', () => {
  describe('values below 1000 (no suffix)', () => {
    test('zero', () => {
      expect(formatNumber(0, 2)).toBe('0');
    });

    test('small integer', () => {
      expect(formatNumber(42, 2)).toBe('42');
    });

    test('small integer with negative decimal places', () => {
      expect(formatNumber(42, -2)).toBe('42');
    });

    test('fractional value with four decimal places', () => {
      expect(formatNumber(3.14159, 4)).toBe('3.1416');
    });

    test('fractional value with one decimal place', () => {
      expect(formatNumber(999.99, 2)).toBe('999.99');
    });
  });

  describe('thousands (k)', () => {
    test('exact 1000', () => {
      expect(formatNumber(1000, 2)).toBe('1k');
    });

    test('1500', () => {
      expect(formatNumber(1500, 2)).toBe('1.5k');
    });

    test('4036.29 — floating point number in thousands range', () => {
      expect(formatNumber(4036.29, 2)).toBe('4.04k');
    });

    test('9999', () => {
      expect(formatNumber(9999, 2)).toBe('10k');
    });

    test('999999 — rounds to 1000k (no rollover to next unit)', () => {
      // this is a corner case, if we want to see 1M here, we need to refactor the function (discussable)
      expect(formatNumber(999999, 2)).toBe('1000k');
    });
  });

  describe('millions (M)', () => {
    test('exact 1 million', () => {
      expect(formatNumber(1_000_000, 2)).toBe('1M');
    });

    test('1.5 million', () => {
      expect(formatNumber(1_501_301, 2)).toBe('1.5M');
    });

    test('4036290.33 millions with fractional part', () => {
      expect(formatNumber(4_036_290.33, 2)).toBe('4.04M');
    });
  });

  describe('billions (B)', () => {
    test('exact 1 billion', () => {
      expect(formatNumber(1_000_000_000, 2)).toBe('1B');
    });

    test('2.5 billion', () => {
      expect(formatNumber(2_500_333_000, 2)).toBe('2.5B');
    });
  });
});
