/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { CancellablePromise } from './CancellablePromise.js';

describe('CancellablePromise', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('cancels promise', async () => {
    const promise = new CancellablePromise<void>(resolve => {
      const token = setTimeout(() => resolve(), 0);
      return () => {
        clearTimeout(token);
      };
    });

    promise.cancel();

    vi.advanceTimersByTime(1);

    await expect(promise).rejects.toThrow('Promise cancelled');
  });

  it('should resolve promise', async () => {
    const promise = new CancellablePromise<number>(resolve => {
      const token = setTimeout(() => resolve(777), 0);
      return () => {
        clearTimeout(token);
      };
    });

    vi.advanceTimersByTime(1);

    await expect(promise).resolves.toBe(777);
  });

  it('should reject promise', async () => {
    const testMessage = 'test';
    const error = new Error(testMessage);
    const promise = new CancellablePromise<number>((resolve, reject) => {
      const token = setTimeout(() => reject(error), 0);
      return () => {
        clearTimeout(token);
      };
    });

    vi.advanceTimersByTime(1);

    await expect(promise).rejects.toThrowError(testMessage);
  });
});
