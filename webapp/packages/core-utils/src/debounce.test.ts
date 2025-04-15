/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, vitest, test, beforeEach, afterEach } from 'vitest';

import { debounce, debounceAsync } from './debounce.js';

describe('Debounce', () => {
  beforeEach(() => {
    vitest.useFakeTimers();
  });

  afterEach(() => {
    vitest.useRealTimers();
  });

  test('function should be executed just once', () => {
    const func = vitest.fn();
    const debouncedFunction = debounce(func, 1000);

    debouncedFunction();
    debouncedFunction();
    debouncedFunction();

    // Fast-forward time
    vitest.runAllTimers();

    expect(func).toHaveBeenCalledTimes(1);
  });
});

describe('DebounceAsync', () => {
  beforeEach(() => {
    vitest.useFakeTimers();
  });

  afterEach(() => {
    vitest.useRealTimers();
  });

  test('function should be executed just once', () => {
    const func = vitest.fn(() => Promise.resolve(true));
    const debouncedFunction = debounceAsync(func, 1000);

    debouncedFunction();
    debouncedFunction();
    debouncedFunction();

    // Fast-forward time
    vitest.runAllTimers();

    expect(func).toHaveBeenCalledTimes(1);
  });
});
