/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vitest } from 'vitest';

import { CancellablePromise } from './CancellablePromise.js';

describe('CancellablePromise', () => {
  vitest.mock('./PromiseCancelledError', () => ({
    PromiseCancelledError: vitest.fn().mockImplementation(() => Error('Promise cancelled')),
  }));

  it('cancels promise', async () => {
    const promise = new CancellablePromise<void>(resolve => {
      const token = setTimeout(() => resolve(), 0);
      return () => {
        clearTimeout(token);
      };
    });

    promise.cancel();

    await expect(promise).rejects.toThrow('Promise cancelled');
  });

  it('should resolve promise', async () => {
    const promise = new CancellablePromise<number>(resolve => {
      const token = setTimeout(() => resolve(777), 0);
      return () => {
        clearTimeout(token);
      };
    });

    await expect(promise).resolves.toBe(777);
  });

  it('should reject promise', async () => {
    const error = new Error('test');
    const promise = new CancellablePromise<number>((resolve, reject) => {
      const token = setTimeout(() => reject(error), 0);
      return () => {
        clearTimeout(token);
      };
    });

    await expect(promise).rejects.toThrow(error);
  });
});
