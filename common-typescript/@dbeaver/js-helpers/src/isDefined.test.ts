/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test } from 'vitest';

import { isDefined } from './isDefined.js';

describe('Is defined', () => {
  test('should return "true" when "\'0\'" is passed', () => {
    expect(isDefined('0')).toBe(true);
  });

  test('should return "true" when "0" is passed', () => {
    expect(isDefined(0)).toBe(true);
  });

  test('should return "true" when "false" is passed', () => {
    expect(isDefined(false)).toBe(true);
  });

  test('should return "true" when "object" is passed', () => {
    expect(isDefined({})).toBe(true);
  });

  test('should return "true" when "array" is passed', () => {
    expect(isDefined([])).toBe(true);
  });

  test('should return "true" when "null" is passed', () => {
    expect(isDefined(null)).toBe(true);
  });

  test('should return "false" when "undefined" is passed', () => {
    expect(isDefined(undefined)).toBe(false);
  });
});
