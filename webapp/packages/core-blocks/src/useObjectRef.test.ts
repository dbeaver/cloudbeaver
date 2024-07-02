/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { renderHook } from '@testing-library/react';

import { useObjectRef } from './useObjectRef';

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

  test('should change ref value', () => {
    const { result } = renderHook(() =>
      useObjectRef({
        count: 0,
      }),
    );

    result.current.count = 123;

    expect(result.current.count).toBe(123);
  });

  test('should bind ref functions', () => {
    const { result } = renderHook(() =>
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
    const anotherContextObject = {
      count: 123,
      increment: result.current.increment,
    };

    result.current.increment();

    expect(result.current.count).toBe(1);

    anotherContextObject.increment();

    expect(anotherContextObject.count).toBe(123);
    expect(result.current.count).toBe(2);
  });

  it('should not bind with empty bind array', () => {
    const { result } = renderHook(() =>
      useObjectRef(
        () => ({
          count: 0,
          increment: function (this: { count: number }) {
            this.count++;
          },
        }),
        false,
        [],
      ),
    );

    expect(typeof result.current.increment).toBe('function');

    const anotherContextObject = {
      count: 123,
      increment: result.current.increment,
    };

    anotherContextObject.increment();

    expect(result.current.count).toBe(0);
    expect(anotherContextObject.count).toBe(124);
  });

  test('should update ref', () => {
    const { result, rerender } = renderHook(
      ({ update }: { update: { count: number; increment?: (this: { count: number }) => void } }) =>
        useObjectRef(() => ({ count: 0 }), update, ['increment'] as const),
      {
        initialProps: {
          update: {
            count: 0,
          },
        },
      },
    );

    expect(result.current.count).toBe(0);

    result.current?.increment?.();

    expect(result.current.count).toBe(0);

    rerender({
      update: {
        count: 1,
        increment: result.current.increment,
      },
    });

    result.current?.increment?.();

    expect(result.current.count).toBe(1);
  });
});
