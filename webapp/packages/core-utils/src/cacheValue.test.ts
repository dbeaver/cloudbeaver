/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vitest } from 'vitest';

import { cacheValue } from './cacheValue.js';

describe('cacheValue', () => {
  it('should return cached value', () => {
    const cache = cacheValue();
    const value = cache.value(() => 1);
    expect(value).toBe(1);
    expect(cache.invalid).toBe(false);
  });

  it('should invalidate cache', () => {
    const cache = cacheValue();
    cache.value(() => 1);
    cache.invalidate();
    expect(cache.invalid).toBe(true);
  });

  it('should calculate new value if invalidated', () => {
    const fn = vitest.fn(() => 1);
    const cache = cacheValue();
    cache.value(fn);
    cache.invalidate();
    expect(cache.invalid).toBe(true);
    const value = cache.value(fn);
    expect(value).toBe(1);
    expect(cache.invalid).toBe(false);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should not calculate new value if not invalidated', () => {
    const fn = vitest.fn(() => 1);
    const cache = cacheValue();
    cache.value(fn);
    const value = cache.value(fn);
    expect(value).toBe(1);
    expect(cache.invalid).toBe(false);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should cache value until it is invalidated', () => {
    const cache = cacheValue();
    expect(cache.value(() => 1)).toBe(1);
    expect(cache.value(() => 2)).toBe(1);
    cache.invalidate();
    expect(cache.value(() => 3)).toBe(3);
  });
});
