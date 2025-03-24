/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test } from 'vitest';

import { isNumber } from './isNumber.js';

describe('isNumber', () => {
  test('returns true for valid numbers', () => {
    expect(isNumber(123)).toBe(true);
    expect(isNumber(123.45)).toBe(true);
    expect(isNumber('123')).toBe(true);
    expect(isNumber('123.45')).toBe(true);
    expect(isNumber(0)).toBe(true);
  });

  test('returns false for non-numeric strings', () => {
    expect(isNumber('hello')).toBe(false);
    expect(isNumber('123abc')).toBe(false);
    expect(isNumber('')).toBe(false);
  });

  test('returns false for non-numeric values', () => {
    expect(isNumber(NaN)).toBe(false);
    expect(isNumber(Infinity)).toBe(false);
    expect(isNumber(-Infinity)).toBe(false);
    expect(isNumber(null)).toBe(false);
    expect(isNumber(undefined)).toBe(false);
    expect(isNumber({})).toBe(false);
    expect(isNumber([])).toBe(false);
    expect(isNumber(true)).toBe(false);
    expect(isNumber(false)).toBe(false);
  });
});
