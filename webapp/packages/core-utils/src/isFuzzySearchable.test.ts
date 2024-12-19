/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from '@jest/globals';

import { isFuzzySearchable } from './isFuzzySearchable.js';

describe('isFuzzySearchable', () => {
  it('should return true if pattern is empty', () => {
    expect(isFuzzySearchable('', 'text')).toBe(true);
    expect(isFuzzySearchable('', '')).toBe(true);
  });

  it('should return false if text is empty', () => {
    expect(isFuzzySearchable('pattern', '')).toBe(false);
  });

  it('should return false if pattern is longer than text', () => {
    expect(isFuzzySearchable('pattern', 'pat')).toBe(false);
  });

  it('should return false if pattern is not recognized', () => {
    expect(isFuzzySearchable('xyz', 'examination')).toBe(false);
  });

  it('should return true if pattern is found in text', () => {
    expect(isFuzzySearchable('pattern', 'pattern')).toBe(true);
    expect(isFuzzySearchable('pattern', 'text pattern')).toBe(true);
    expect(isFuzzySearchable('cat', 'catalog')).toBe(true);
    expect(isFuzzySearchable('bird', 'binaryword')).toBe(true);
    expect(isFuzzySearchable('dog', 'doing')).toBe(true);
  });

  it('should return true if pattern is found in text ignoring case', () => {
    expect(isFuzzySearchable('pattern', 'Pattern')).toBe(true);
    expect(isFuzzySearchable('pattern', 'TEXT PATTERN')).toBe(true);
    expect(isFuzzySearchable('cat', 'CATALOG')).toBe(true);
    expect(isFuzzySearchable('bird', 'BINARYWORD')).toBe(true);
    expect(isFuzzySearchable('dog', 'DOING')).toBe(true);
  });
});
