/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { afterEach, beforeEach, describe, expect, it, vitest } from 'vitest';
import { renderHook } from '@testing-library/react';

import { type IScrollState, useControlledScroll } from './useControlledScroll.js';

describe('useControlledScroll', () => {
  let element: HTMLDivElement;
  let scrollState: IScrollState;

  beforeEach(() => {
    vitest.useFakeTimers();
  });

  afterEach(() => {
    vitest.useRealTimers();
    element.remove();
  });

  beforeEach(() => {
    element = document.createElement('div');
    scrollState = { scrollTop: 100, scrollLeft: 100 };
  });

  it('should set initial scroll position', () => {
    scrollState = { scrollTop: 50, scrollLeft: 30 };
    renderHook(() => useControlledScroll(element, scrollState));

    vitest.runAllTimers();

    expect(element.scrollTop).toBe(50);
    expect(element.scrollLeft).toBe(30);
  });

  it('should update scroll state when scrolling', () => {
    renderHook(() => useControlledScroll(element, scrollState));

    element.scrollTop = 100;
    element.scrollLeft = 50;
    element.dispatchEvent(new Event('scroll'));

    expect(scrollState.scrollTop).toBe(100);
    expect(scrollState.scrollLeft).toBe(50);
  });

  it('should not update scroll state when scrolling was without scroll event', () => {
    renderHook(() => useControlledScroll(element, scrollState));

    element.scrollTop = 150;
    element.scrollLeft = 50;

    expect(scrollState.scrollTop).toBe(100);
    expect(scrollState.scrollLeft).toBe(100);
  });

  it('should update scroll position when state changes', () => {
    const { rerender } = renderHook(({ el, state }) => useControlledScroll(el, state), { initialProps: { el: element, state: scrollState } });

    const newState = { scrollTop: 75, scrollLeft: 25 };
    rerender({ el: element, state: newState });

    vitest.runAllTimers();

    expect(element.scrollTop).toBe(75);
    expect(element.scrollLeft).toBe(25);
  });

  it('should clean up event listener on unmount', () => {
    const removeEventListenerSpy = vitest.spyOn(element, 'removeEventListener');
    const { unmount } = renderHook(() => useControlledScroll(element, scrollState));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });

  it('should not set scroll position if element is null', () => {
    renderHook(() => useControlledScroll(null, scrollState));

    vitest.runAllTimers();

    // No errors should be thrown
    expect(true).toBe(true);
  });

  it('should change element', () => {
    const { rerender } = renderHook(({ el, state }) => useControlledScroll(el, state), {
      initialProps: { el: element, state: scrollState },
    });

    const newElement = document.createElement('div');

    expect(newElement.scrollTop).toBe(0);
    expect(newElement.scrollLeft).toBe(0);

    rerender({ el: newElement, state: scrollState });

    vitest.runAllTimers();

    expect(newElement.scrollTop).toBe(100);
    expect(newElement.scrollLeft).toBe(100);
  });

  it('should change element and state and apply the new state to the new element', () => {
    const { rerender } = renderHook(({ el, state }) => useControlledScroll(el, state), {
      initialProps: { el: element, state: scrollState },
    });

    const newElement = document.createElement('div');
    const newState = { scrollTop: 75, scrollLeft: 25 };

    expect(newElement.scrollTop).toBe(0);
    expect(newElement.scrollLeft).toBe(0);

    rerender({ el: newElement, state: newState });

    vitest.runAllTimers();

    expect(newElement.scrollTop).toBe(75);
    expect(newElement.scrollLeft).toBe(25);
  });

  it('should remove event listener if element becomes null', () => {
    const { rerender } = renderHook(({ el, state }) => useControlledScroll(el, state), {
      initialProps: { el: element as HTMLDivElement | null, state: scrollState },
    });

    const removeEventListenerSpy = vitest.spyOn(element, 'removeEventListener');

    rerender({ el: null, state: scrollState });

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});
