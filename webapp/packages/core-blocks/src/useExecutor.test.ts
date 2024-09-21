/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { renderHook } from '@testing-library/react';

import type { IExecutorHandler, IExecutorHandlersCollection } from '@cloudbeaver/core-executor';

import { useExecutor } from './useExecutor.js';
import { useObjectRef } from './useObjectRef.js';

jest.mock('./useObjectRef', () => ({
  useObjectRef: jest.fn(obj => obj),
}));

describe.skip('useExecutor', () => {
  let mockExecutor: IExecutorHandlersCollection<any>;

  beforeEach(() => {
    mockExecutor = {
      addHandler: jest.fn(),
      removeHandler: jest.fn(),
      addPostHandler: jest.fn(),
      removePostHandler: jest.fn(),
      before: jest.fn(),
      removeBefore: jest.fn(),
      next: jest.fn(),
      removeNext: jest.fn(),
    } as unknown as IExecutorHandlersCollection<any>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should add and remove handlers', () => {
    const handler1: IExecutorHandler<any> = jest.fn();
    const handler2: IExecutorHandler<any> = jest.fn();

    const { unmount } = renderHook(() =>
      useExecutor({
        executor: mockExecutor,
        handlers: [handler1, handler2],
      }),
    );

    expect(mockExecutor.addHandler).toHaveBeenCalledTimes(2);

    unmount();

    expect(mockExecutor.removeHandler).toHaveBeenCalledTimes(2);
  });

  test('should add and remove post handlers', () => {
    const postHandler1: IExecutorHandler<any> = jest.fn();
    const postHandler2: IExecutorHandler<any> = jest.fn();

    const { unmount } = renderHook(() =>
      useExecutor({
        executor: mockExecutor,
        postHandlers: [postHandler1, postHandler2],
      }),
    );

    expect(mockExecutor.addPostHandler).toHaveBeenCalledTimes(2);

    unmount();

    expect(mockExecutor.removePostHandler).toHaveBeenCalledTimes(2);
  });

  test('should add and remove next executor', () => {
    const nextExecutor = {} as IExecutorHandlersCollection<any>;

    const { unmount } = renderHook(() =>
      useExecutor({
        executor: mockExecutor,
        next: nextExecutor,
      }),
    );

    expect(mockExecutor.next).toHaveBeenCalledWith(nextExecutor);

    unmount();

    expect(mockExecutor.removeNext).toHaveBeenCalledWith(nextExecutor);
  });

  test('should add and remove before executor', () => {
    const beforeExecutor = {} as IExecutorHandlersCollection<any>;

    const { unmount } = renderHook(() =>
      useExecutor({
        executor: mockExecutor,
        before: beforeExecutor,
      }),
    );

    expect(mockExecutor.before).toHaveBeenCalledWith(beforeExecutor);

    unmount();

    expect(mockExecutor.removeBefore).toHaveBeenCalledWith(beforeExecutor);
  });

  test('should do nothing if executor is not provided', () => {
    renderHook(() =>
      useExecutor({
        handlers: [jest.fn()],
        postHandlers: [jest.fn()],
      }),
    );

    expect(mockExecutor.addHandler).not.toHaveBeenCalled();
    expect(mockExecutor.addPostHandler).not.toHaveBeenCalled();
  });

  test('should use useObjectRef', () => {
    const options = {
      executor: mockExecutor,
      handlers: [jest.fn()],
    };

    renderHook(() => useExecutor(options));

    expect(useObjectRef).toHaveBeenCalledWith(options);
  });
});
