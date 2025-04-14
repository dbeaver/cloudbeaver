/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useCombinedHandler } from './useCombinedHandler.js';

vi.mock('./useObjectRef', () => ({
  useObjectRef: vi.fn(value => value),
}));

describe.skip('useCombinedHandler', () => {
  test('should call all provided handlers', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const { result } = renderHook(() => useCombinedHandler(handler1, handler2));

    result.current('arg1', 'arg2');

    expect(handler1).toHaveBeenCalledWith('arg1', 'arg2');
    expect(handler2).toHaveBeenCalledWith('arg1', 'arg2');
  });

  test('should handle null and undefined handlers', () => {
    const { result } = renderHook(() => useCombinedHandler(null, undefined));

    expect(() => result.current('testArg')).not.toThrow();
  });

  test('should not fail when no handlers are provided', () => {
    const { result } = renderHook(() => useCombinedHandler());

    expect(() => result.current()).not.toThrow();
  });

  test('should allow the combined handler to be called multiple times', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const { result } = renderHook(() => useCombinedHandler(handler1, handler2));

    result.current('firstCall');
    result.current('secondCall');

    expect(handler1).toHaveBeenNthCalledWith(1, 'firstCall');
    expect(handler1).toHaveBeenNthCalledWith(2, 'secondCall');

    expect(handler2).toHaveBeenNthCalledWith(1, 'firstCall');
    expect(handler2).toHaveBeenNthCalledWith(2, 'secondCall');
  });

  test('should work with asynchronous handlers', () => {
    const handler1 = vi.fn(async arg => await Promise.resolve(arg));
    const handler2 = vi.fn(async arg => await Promise.resolve(arg));

    const { result } = renderHook(() => useCombinedHandler(handler1, handler2));

    result.current('asyncArg');

    expect(handler1).toHaveBeenCalledWith('asyncArg');
    expect(handler2).toHaveBeenCalledWith('asyncArg');
  });
});
