/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vitest } from 'vitest';

import { LoadingError } from './LoadingError.js';

describe('LoadingError', () => {
  it('should be instance of Error', () => {
    const error = new LoadingError(() => {}, 'test');

    expect(error instanceof Error).toBeTruthy();
  });

  it('should trigger onRefresh', () => {
    const onRefresh = vitest.fn();
    const error = new LoadingError(onRefresh, 'test');

    error.refresh();

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('should refresh cause of the cause', () => {
    const onRefresh = vitest.fn();
    const cause = new LoadingError(onRefresh, 'test');
    const causeCause = new LoadingError(onRefresh, 'test', { cause });
    const error = new LoadingError(onRefresh, 'test', { cause: causeCause });

    vitest.spyOn(causeCause, 'refresh');
    vitest.spyOn(cause, 'refresh');

    error.refresh();

    expect(causeCause.refresh).toHaveBeenCalledTimes(1);
    expect(cause.refresh).toHaveBeenCalledTimes(1);

    expect(onRefresh).toHaveBeenCalledTimes(3);
    expect(error.cause).toBe(causeCause);
  });

  it('should pass cause through the regular error', () => {
    const onRefresh = vitest.fn();
    const cause = new LoadingError(onRefresh, 'test', { cause: 'unit test' });
    const regularError = new Error('test', { cause });
    const error = new LoadingError(onRefresh, 'test', { cause: regularError });

    vitest.spyOn(cause, 'refresh');

    error.refresh();

    expect(cause.refresh).toHaveBeenCalledTimes(1);
    expect(onRefresh).toHaveBeenCalledTimes(2);
  });
});
