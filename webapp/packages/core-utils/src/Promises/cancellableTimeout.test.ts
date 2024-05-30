/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { cancellableTimeout } from './cancellableTimeout';

jest.mock('./CancellablePromise', () => ({
  CancellablePromise: jest.fn().mockImplementation(() => ({
    cancel: jest.fn(),
  })),
}));

describe('cancellableTimeout', () => {
  it('resolves after the specified timeout', async () => {
    const timeout = 0;
    const start = Date.now();

    const promise = cancellableTimeout(timeout);

    await promise;

    expect(Date.now() - start).toBe(timeout);
  });
});
