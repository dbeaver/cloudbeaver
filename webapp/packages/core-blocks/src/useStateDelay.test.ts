/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { renderHook, waitFor } from '@testing-library/react';

import { useStateDelay } from './useStateDelay';

interface IHookProps {
  value: boolean;
  delay: number;
  callback?: VoidFunction;
}

const useStateDelayWrapper = ({ value, delay, callback }: IHookProps) => useStateDelay(value, delay, callback);

describe('useStateDelay', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  test("should return initial state during whole hook's lifecycle", async () => {
    const { result } = renderHook(() => useStateDelay(true, 100));
    expect(result.current).toBe(true);
    await waitFor(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });
    expect(result.current).toBe(true);
    await waitFor(async () => {
      await new Promise(resolve => setTimeout(resolve, 60));
    });
    expect(result.current).toBe(true);
  });

  test('should return updated state after delay if it was updated', async () => {
    const { result, rerender } = renderHook(({ value, delay }: IHookProps) => useStateDelayWrapper({ value, delay }), {
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
    await waitFor(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });
    expect(result.current).toBe(false);
    await waitFor(async () => {
      await new Promise(resolve => setTimeout(resolve, 60));
    });
    expect(result.current).toBe(true);
  });

  test('should execute callback on state change', async () => {
    const callback = jest.fn();
    const { rerender } = renderHook(({ value, delay }: IHookProps) => useStateDelayWrapper({ value, delay, callback }), {
      initialProps: {
        value: false,
        delay: 100,
        callback,
      },
    });
    expect(callback).toHaveBeenCalledTimes(0);
    await waitFor(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });
    expect(callback).toHaveBeenCalledTimes(0);
    rerender({
      value: true,
      delay: 100,
      callback,
    });
    await waitFor(async () => {
      await new Promise(resolve => setTimeout(resolve, 60));
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('should not call callback', async () => {
    const callback = jest.fn();
    const { result, rerender } = renderHook(({ value, delay }: IHookProps) => useStateDelayWrapper({ value, delay, callback }), {
      initialProps: {
        value: false,
        delay: 100,
        callback,
      },
    });
    expect(result.current).toBe(false);
    expect(callback).toHaveBeenCalledTimes(0);
    await waitFor(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });
    expect(callback).toHaveBeenCalledTimes(0);
    rerender({
      value: false,
      delay: 100,
      callback,
    });
    await waitFor(async () => {
      await new Promise(resolve => setTimeout(resolve, 60));
    });
    expect(callback).toHaveBeenCalledTimes(0);
  });

  test("should prolong delay if was updated as hook's argument", async () => {
    const { result, rerender } = renderHook(({ value, delay }: IHookProps) => useStateDelayWrapper({ value, delay }), {
      initialProps: {
        value: false,
        delay: 100,
      },
    });
    expect(result.current).toBe(false);
    await waitFor(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });
    rerender({
      value: true,
      delay: 200,
    });
    await waitFor(async () => {
      await new Promise(resolve => setTimeout(resolve, 60));
    });
    expect(result.current).toBe(false);
    await waitFor(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    expect(result.current).toBe(true);
  });
});
