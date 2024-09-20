/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';

import { useStateDelay } from './useStateDelay.js';

interface IHookProps {
  value: boolean;
  delay: number;
  callback?: VoidFunction;
}

const useStateDelayWrapper = ({ value, delay, callback }: IHookProps) => useStateDelay(value, delay, callback);

describe('useStateDelay', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });

  test("should return initial state during whole hook's lifecycle", async () => {
    const { result, unmount } = renderHook(() => useStateDelay(true, 100));
    expect(result.current).toBe(true);
    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(result.current).toBe(true);
    act(() => {
      jest.advanceTimersByTime(60);
    });
    expect(result.current).toBe(true);
    unmount();
  });

  test('should return updated state after delay if it was updated', async () => {
    const { result, rerender, unmount } = renderHook(({ value, delay }: IHookProps) => useStateDelayWrapper({ value, delay }), {
      initialProps: {
        value: false,
        delay: 100,
      },
    });
    expect(result.current).toBe(false);
    rerender({
      value: true,
      delay: 100,
    });
    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(result.current).toBe(false);
    act(() => {
      jest.advanceTimersByTime(60);
    });
    expect(result.current).toBe(true);
    unmount();
  });

  test('should execute callback on state change', async () => {
    const callback = jest.fn();
    const { rerender, unmount } = renderHook(({ value, delay }: IHookProps) => useStateDelayWrapper({ value, delay, callback }), {
      initialProps: {
        value: false,
        delay: 100,
        callback,
      },
    });
    expect(callback).toHaveBeenCalledTimes(0);
    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(callback).toHaveBeenCalledTimes(0);
    rerender({
      value: true,
      delay: 100,
      callback,
    });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(callback).toHaveBeenCalledTimes(1);
    unmount();
  });

  test('should not call callback', async () => {
    const callback = jest.fn();
    const { result, rerender, unmount } = renderHook(({ value, delay }: IHookProps) => useStateDelayWrapper({ value, delay, callback }), {
      initialProps: {
        value: false,
        delay: 100,
        callback,
      },
    });
    expect(result.current).toBe(false);
    expect(callback).toHaveBeenCalledTimes(0);
    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(callback).toHaveBeenCalledTimes(0);
    rerender({
      value: false,
      delay: 100,
      callback,
    });
    act(() => {
      jest.advanceTimersByTime(60);
    });
    expect(callback).toHaveBeenCalledTimes(0);
    unmount();
  });

  test("should prolong delay if was updated as hook's argument", async () => {
    const { result, rerender, unmount } = renderHook(({ value, delay }: IHookProps) => useStateDelayWrapper({ value, delay }), {
      initialProps: {
        value: false,
        delay: 100,
      },
    });
    expect(result.current).toBe(false);
    act(() => {
      jest.advanceTimersByTime(50);
    });
    rerender({
      value: true,
      delay: 200,
    });
    act(() => {
      jest.advanceTimersByTime(60);
    });
    expect(result.current).toBe(false);
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current).toBe(true);
    unmount();
  });
});
