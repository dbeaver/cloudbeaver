/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { describe, expect, test, vitest } from 'vitest';
import { renderHook } from '@testing-library/react';

import * as coreUtils from '@cloudbeaver/core-utils';

import { useObjectRef } from './useObjectRef.js';

vitest.mock('@cloudbeaver/core-utils', () => ({
  bindFunctions: vitest.fn(),
}));

describe('useObjectRef', () => {
  test('should initialize', () => {
    const { result } = renderHook(() =>
      useObjectRef({
        count: 0,
        increment: function (this: { count: number }) {
          this.count++;
        },
      }),
    );

    expect(result.current.count).toBe(0);
    expect(typeof result.current.increment).toBe('function');
  });

  test('should initialize with empty object', () => {
    const { result } = renderHook(() => useObjectRef({}));

    expect(result.current).toEqual({});
  });

  test('should bind ref functions', () => {
    const bindFunctions = vitest.spyOn(coreUtils, 'bindFunctions');

    renderHook(() =>
      useObjectRef(
        () => ({
          count: 0,
          increment: function (this: { count: number }) {
            this.count++;
          },
        }),
        false,
        ['increment'],
      ),
    );

    expect(bindFunctions).toHaveBeenCalledTimes(1);
    bindFunctions.mockClear();
  });

  test('should merge update to bind', () => {
    const bindFunctions = vitest.spyOn(coreUtils, 'bindFunctions');

    renderHook(() =>
      useObjectRef(
        () => ({
          count: 0,
          increment: function (this: { count: number }) {
            this.count++;
          },
        }),
        {
          count: 0,
        },
        ['increment'],
      ),
    );

    expect(bindFunctions).toHaveBeenCalledTimes(1);
    bindFunctions.mockClear();
  });

  test('should update ref via initial state method', () => {
    type TRef = { update: { count: number; increment?: (this: { count: number }) => void } };
    const init = () => ({ count: 0 });

    const { result } = renderHook(({ update }: TRef) => useObjectRef(init, update, ['increment']), {
      initialProps: {
        update: {
          count: 0,
          increment: function () {
            this.count++;
          },
        },
      },
    });

    expect(result.current.count).toBe(0);

    result.current?.increment?.();

    expect(result.current.count).toBe(1);
  });

  test('should update ref', () => {
    type TRef = { update: { count: number } };
    const init = () => ({ count: 0 });

    const { result, rerender } = renderHook(({ update }: TRef) => useObjectRef(init, update), {
      initialProps: {
        update: {
          count: 0,
        },
      } as TRef,
    });

    expect(result.current.count).toBe(0);

    rerender({ update: { count: 3 } });

    expect(result.current.count).toBe(3);
  });
});
