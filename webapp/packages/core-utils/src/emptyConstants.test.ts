/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { EMPTY_ARRAY, EMPTY_OBJECT } from './emptyConstants.js';

describe('EMPTY_ARRAY', () => {
  it('should be an empty array', () => {
    expect(EMPTY_ARRAY).toEqual([]);
    expect(EMPTY_ARRAY.length).toBe(0);
  });

  it('should be frozen', () => {
    expect(Object.isFrozen(EMPTY_ARRAY)).toBe(true);
  });

  it('should throw when attempting to mutate', () => {
    expect(() => {
      (EMPTY_ARRAY as any[]).push(1);
    }).toThrow();
  });

  it('should always be the same reference', () => {
    expect(EMPTY_ARRAY).toBe(EMPTY_ARRAY);
  });
});

describe('EMPTY_OBJECT', () => {
  it('should be an empty object', () => {
    expect(EMPTY_OBJECT).toEqual({});
    expect(Object.keys(EMPTY_OBJECT).length).toBe(0);
  });

  it('should be frozen', () => {
    expect(Object.isFrozen(EMPTY_OBJECT)).toBe(true);
  });

  it('should throw when attempting to mutate', () => {
    expect(() => {
      (EMPTY_OBJECT as any)['key'] = 'value';
    }).toThrow();
  });

  it('should always be the same reference', () => {
    expect(EMPTY_OBJECT).toBe(EMPTY_OBJECT);
  });
});
