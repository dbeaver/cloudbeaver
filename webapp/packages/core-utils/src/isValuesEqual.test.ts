/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test } from 'vitest';

import { isValuesEqual } from './isValuesEqual.js';

describe('Is values equal', () => {
  test('should return "true" when the identical strings are passed', () => {
    expect(isValuesEqual('value', 'value')).toBe(true);
  });

  test('should return "true" when the identical numbers are passed', () => {
    expect(isValuesEqual(0, 0)).toBe(true);
  });

  test('should return "true" when the identical booleans are passed', () => {
    expect(isValuesEqual(true, true)).toBe(true);
  });

  test('should return "true" when the "null" and "undefined" are passed and default value is an "empty string"', () => {
    expect(isValuesEqual(null, undefined, '')).toBe(true);
  });

  test('should return "true" when the "empty string" and "undefined" are passed and default value is an "empty string"', () => {
    expect(isValuesEqual('', undefined, '')).toBe(true);
  });

  test('should return "false" when the different strings are passed', () => {
    expect(isValuesEqual('value', 'another value')).toBe(false);
  });

  test('should return "false" when the different numbers are passed', () => {
    expect(isValuesEqual(0, 1)).toBe(false);
  });

  test('should return "false" when the different booleans are passed', () => {
    expect(isValuesEqual(true, false)).toBe(false);
  });
});
