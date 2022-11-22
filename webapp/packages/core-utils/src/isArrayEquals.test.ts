/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { isArraysEqual } from './isArraysEqual';

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
});