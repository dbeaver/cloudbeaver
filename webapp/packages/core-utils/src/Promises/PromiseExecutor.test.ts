/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { beforeEach, describe, expect, it } from 'vitest';

import { PromiseExecutor } from './PromiseExecutor.js';

describe('PromiseExecutor', () => {
  let promiseExecutor: PromiseExecutor<string>;

  beforeEach(() => {
    promiseExecutor = new PromiseExecutor();
  });

  it('should initialize with a promise', () => {
    expect(promiseExecutor.promise).toBeInstanceOf(Promise);
  });

  it('should resolve the promise with the correct value', async () => {
    const testValue = 'resolved value';

    promiseExecutor.resolve(testValue);

    await expect(promiseExecutor.promise).resolves.toBe(testValue);
  });

  it('should reject the promise with the correct reason', async () => {
    const testError = new Error('test error');

    promiseExecutor.reject(testError);

    await expect(promiseExecutor.promise).rejects.toBe(testError);
  });

  it('should resolve with a PromiseLike object', async () => {
    const testPromiseLike = Promise.resolve('promise-like value');

    promiseExecutor.resolve(testPromiseLike);

    await expect(promiseExecutor.promise).resolves.toBe('promise-like value');
  });
});
