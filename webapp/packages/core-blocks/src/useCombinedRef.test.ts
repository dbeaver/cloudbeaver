/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
//@ts-nocheck
import { describe, expect, it, vitest } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import React from 'react';

import { useCombinedRef } from './useCombinedRef.js';

describe('useCombinedRef', () => {
  it('should handle ref as function', () => {
    const callbackRef = vitest.fn();
    const { result } = renderHook(() => useCombinedRef(callbackRef));

    const testInstance = { test: true };

    act(() => {
      result.current(testInstance);
    });

    expect(callbackRef).toHaveBeenCalledWith(testInstance);
  });

  it('should handle ref as RefObject', () => {
    const mutableRef = React.createRef();
    const { result } = renderHook(() => useCombinedRef(mutableRef));

    const testInstance = { test: true };

    act(() => {
      result.current(testInstance);
    });

    expect(mutableRef.current).toBe(testInstance);
  });

  it('should handle ref as null', () => {
    const { result } = renderHook(() => useCombinedRef(null));

    const testInstance = { test: true };

    expect(() => {
      act(() => {
        result.current(testInstance);
      });
    }).not.toThrow();
  });

  it('should handle multiple refs', () => {
    const callbackRef = vitest.fn();
    const mutableRef = React.createRef();
    const anotherMutableRef = React.createRef();
    const { result } = renderHook(() => useCombinedRef(callbackRef, mutableRef, anotherMutableRef));

    const testInstance = { test: true };

    act(() => {
      result.current(testInstance);
    });

    expect(callbackRef).toHaveBeenCalledWith(testInstance);
    expect(mutableRef.current).toBe(testInstance);
    expect(anotherMutableRef.current).toBe(testInstance);
  });
});
