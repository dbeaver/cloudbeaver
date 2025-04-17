/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, vitest, test } from 'vitest';

import { isArraysEqual } from './isArraysEqual.js';

describe('Is array equals', () => {
  test('should return "true" when arrays are the same', () => {
    expect(isArraysEqual([1, '1', true], [1, '1', true])).toBe(true);
  });

  test('should return "false" when arrays are not the same', () => {
    expect(isArraysEqual([1, '2', true], [2, '1', true])).toBe(false);
  });

  test('should return "true" when arrays have the same elements but elements order is different', () => {
    expect(isArraysEqual(['1', 1, true], [1, '1', true])).toBe(true);
  });

  test('should return "false" when arrays length is different and the first array is larger', () => {
    expect(isArraysEqual([1, true, '1'], [1, true])).toBe(false);
  });

  test('should return "false" when arrays length is different and the second array is larger', () => {
    expect(isArraysEqual([1, true], [1, true, '1'])).toBe(false);
  });

  test('should use isEqual argument if passed', () => {
    expect(isArraysEqual([{ a: 1 }], [{ a: 1 }], (a, b) => a.a === b.a)).toBe(true);
  });

  test('should return "true" when arrays are the same and "order" argument is "true"', () => {
    expect(isArraysEqual([1, '1', true], [1, '1', true], undefined, true)).toBe(true);
  });

  test('should return "false" when arrays are not the same and "order" argument is "true"', () => {
    expect(isArraysEqual([1, '2', true], [2, '1', true], undefined, true)).toBe(false);
  });

  test('should return "false" when arrays have the same elements but elements order is different and "order" argument is "true"', () => {
    expect(isArraysEqual(['1', 1, true], [1, '1', true], undefined, true)).toBe(false);
  });

  test('should return "false" when arrays length is different and the first array is larger and "order" argument is "true"', () => {
    expect(isArraysEqual([1, true, '1'], [1, true], undefined, true)).toBe(false);
  });

  test('should return "false" when arrays length is different and the second array is larger and "order" argument is "true"', () => {
    expect(isArraysEqual([1, true], [1, true, '1'], undefined, true)).toBe(false);
  });

  test('should use isEqual argument if passed and "order" argument is "true"', () => {
    expect(isArraysEqual([{ a: 1 }], [{ a: 1 }], (a, b) => a.a === b.a, true)).toBe(true);
  });

  test('should not pass with no equal fn and array of objects (length > 1)', () => {
    expect(isArraysEqual([{ b: 3 }, { a: 1 }], [{ a: 1 }, { b: 3 }])).toBe(false);
  });

  test('should not pass with no equal fn and primitive and non primitive in array', () => {
    expect(isArraysEqual([1, 1, { a: 1 }, 2], [2, { a: 1 }, 1, 1])).toBe(false);
  });

  test('should pass with equal fn and array of objects (length > 1)', () => {
    const isEqual = vitest.fn((a: { a: number }, b: { a: number }) => a.a === b.a);
    expect(isArraysEqual([{ a: 3 }, { a: 1 }], [{ a: 1 }, { a: 3 }], isEqual)).toBe(true);
  });

  test('should pass with equal fn and primitive and non primitive in array', () => {
    const isEqual = vitest.fn((a: { a: number }, b: { a: number }) => a.a === b.a);
    expect(isArraysEqual([1, { a: 3 }, { a: 1 }] as any, [1, { a: 1 }, { a: 3 }] as any, isEqual)).toBe(true);
  });
});
