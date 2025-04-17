/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { cancellableTimeout } from './cancellableTimeout.js';

describe('cancellableTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves after the specified timeout', async () => {
    const timeout = 0;
    const start = Date.now();
    let isResolved = false;

    const promise = cancellableTimeout(timeout).then(() => {
      isResolved = true;
    });

    vi.advanceTimersByTime(timeout);
    await promise;

    expect(Date.now() - start).toBe(timeout);
    expect(isResolved).toBe(true);
  });
});
