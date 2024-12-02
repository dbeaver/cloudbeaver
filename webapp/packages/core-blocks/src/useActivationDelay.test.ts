/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';

import { useActivationDelay } from './useActivationDelay.js';

describe('useActivationDelay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should initially return false', () => {
    const { result } = renderHook(() => useActivationDelay(false, 1000));
    expect(result.current).toBe(false);
  });

  it('should not change state before delay when activated', () => {
    const { result } = renderHook(() => useActivationDelay(true, 1000));

    expect(result.current).toBe(false);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe(false);
  });

  it('should change state after delay when activated', () => {
    const { result } = renderHook(() => useActivationDelay(true, 1000));

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current).toBe(true);
  });

  it('should fire callback after delay when activated', () => {
    const callback = jest.fn();
    renderHook(() => useActivationDelay(true, 1000, callback));

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should handle callback changes', () => {
    const initialCallback = jest.fn();
    const newCallback = jest.fn();

    const { rerender } = renderHook(({ callback }) => useActivationDelay(true, 1000, callback), { initialProps: { callback: initialCallback } });

    rerender({ callback: newCallback });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(initialCallback).not.toHaveBeenCalled();
    expect(newCallback).toHaveBeenCalledTimes(1);
  });

  it('should clear timeout on unmount', () => {
    const callback = jest.fn();
    const { unmount } = renderHook(() => useActivationDelay(true, 1000, callback));

    unmount();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('should not fire callback if delay changed', () => {
    const callback = jest.fn();
    const { rerender } = renderHook(({ delay }) => useActivationDelay(true, delay, callback), { initialProps: { delay: 1000 } });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    rerender({ delay: 2000 });

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(callback).toHaveBeenCalledTimes(0);
  });

  it('should not fire callback when state changed to false', () => {
    const callback = jest.fn();
    const { rerender } = renderHook(({ state }) => useActivationDelay(state, 1000, callback), { initialProps: { state: true } });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    rerender({ state: false });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledTimes(0);
  });

  it('should handle rapid state changes', () => {
    const callback = jest.fn();
    const { rerender } = renderHook(({ state }) => useActivationDelay(state, 1000, callback), { initialProps: { state: true } });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    rerender({ state: false });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    rerender({ state: true });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should work with zero delay', () => {
    const callback = jest.fn();
    renderHook(() => useActivationDelay(true, 0, callback));

    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
