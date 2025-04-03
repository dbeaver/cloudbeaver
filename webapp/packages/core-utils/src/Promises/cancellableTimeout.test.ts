/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { afterEach, beforeEach, describe, expect, it, vitest } from 'vitest';

import { cancellableTimeout } from './cancellableTimeout.js';

vitest.mock('./CancellablePromise', () => ({
  CancellablePromise: vitest.fn().mockImplementation(executor => {
    executor(() => {});
    return { cancel: vitest.fn(), then: vitest.fn(), catch: vitest.fn() };
  }),
}));

describe('cancellableTimeout', () => {
  beforeEach(() => {
    vitest.useFakeTimers();
  });

  afterEach(() => {
    vitest.useRealTimers();
  });

  it('should resolve after specified timeout', async () => {
    const timeout = 1000;
    const start = Date.now();

    const promise = cancellableTimeout(timeout);

    await vitest.runAllTimersAsync();

    await expect(promise).resolves.toBeUndefined();

    expect(Date.now() - start).toBe(timeout);
  });
});
