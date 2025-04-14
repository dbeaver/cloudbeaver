/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test } from 'vitest';

import { getUniqueName } from './getUniqueName.js';

describe('Get unique name', () => {
  test('should return "name (1)" when "name" is passed and "name" is presented', () => {
    expect(getUniqueName('name', ['name', 'another name'])).toBe('name (1)');
  });

  test('should return "name (1) (1)" when "name (1)" is passed and "name (1)" is presented', () => {
    expect(getUniqueName('name (1)', ['name (1)', 'another name'])).toBe('name (1) (1)');
  });

  test('should return "name (2)" when "name" is passed and "name" and "name (1)" are presented', () => {
    expect(getUniqueName('name', ['name', 'name (1)', 'another name'])).toBe('name (2)');
  });

  test('should return "name" when "name" is passed and "name (2)" and "name (1)" are presented', () => {
    expect(getUniqueName('name', ['name (2)', 'name (1)', 'another name'])).toBe('name');
  });
});
