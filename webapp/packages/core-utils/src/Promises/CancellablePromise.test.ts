/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vi } from 'vitest';

import { CancellablePromise } from './CancellablePromise.js';

describe('CancellablePromise', () => {
  it('should resolve with value', async () => {
    const promise = new CancellablePromise<string>(resolve => {
      resolve('test');
      return () => {};
    });

    const result = await promise;
    expect(result).toBe('test');
  });

  it('should reject with error', async () => {
    const error = new Error('test error');
    const promise = new CancellablePromise<string>((_, reject) => {
      reject(error);
      return () => {};
    });

    await expect(promise).rejects.toThrow(error);
  });

  it('should reject with PromiseCancelledError when cancelled', async () => {
    const promise = new CancellablePromise<string>(() => () => {});

    promise.cancel();

    await expect(promise).rejects.toThrow();
  });

  it('should call cancel function when cancelled', async () => {
    const cancelFn = vi.fn();
    const promise = new CancellablePromise<string>(() => cancelFn);

    promise.cancel();
    expect(cancelFn).toHaveBeenCalled();
    await expect(promise).rejects.toThrow();
  });

  it('should handle executor throwing error', async () => {
    const error = new Error('executor error');
    const promise = new CancellablePromise<string>(() => {
      throw error;
    });

    await expect(promise).rejects.toThrow(error);
  });
});
