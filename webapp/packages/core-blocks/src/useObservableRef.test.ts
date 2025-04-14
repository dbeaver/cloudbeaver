/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { describe, expect, test, vitest } from 'vitest';
import { renderHook } from '@testing-library/react';
import { action, computed, isObservable, observable, runInAction } from 'mobx';

import * as coreUtils from '@cloudbeaver/core-utils';

import { useObservableRef } from './useObservableRef.js';

vitest.mock('@cloudbeaver/core-utils', () => ({
  bindFunctions: vitest.fn(),
}));

describe('useObservableRef', () => {
  test('should initialize with a function', () => {
    const init = () => ({ count: 0 });
    const observed = { count: observable };

    const { result } = renderHook(() => useObservableRef(init, observed, false));

    expect(result.current.count).toBe(0);
    expect(isObservable(result.current)).toBe(true);
  });

  test('should initialize with an object', () => {
    const init = { count: 0 };
    const observed = { count: observable };

    const { result } = renderHook(() => useObservableRef(init, observed));

    expect(result.current.count).toBe(0);
    expect(isObservable(result.current)).toBe(true);
  });

  test('should bind functions', () => {
    const bindFunctions = vitest.spyOn(coreUtils, 'bindFunctions');

    const observed = { count: observable, increment: action };

    renderHook(() =>
      useObservableRef(
        () => ({
          count: 0,
          increment: function (this: { count: number }) {
            this.count++;
          },
        }),
        observed,
        false,
        ['increment'],
      ),
    );

    expect(bindFunctions).toHaveBeenCalledTimes(1);

    bindFunctions.mockClear();
  });

  test('should handle computed properties', () => {
    const init = () => ({
      count: 0,
      get doubleCount() {
        return this.count * 2;
      },
    });
    const observed = { count: observable, doubleCount: computed };

    const { result } = renderHook(() => useObservableRef(init, observed, false));

    expect(result.current.doubleCount).toBe(0);
    runInAction(() => {
      result.current.count = 5;
    });
    expect(result.current.doubleCount).toBe(10);
  });

  test('should merge update param to initial state', () => {
    const init = () => ({ count: 0, text: 'hello' });
    const observed = { count: observable, text: observable };
    const update = { count: 1 };

    const { result } = renderHook(() => useObservableRef(init, observed, update));

    expect(result.current.count).toBe(1);
    expect(result.current.text).toBe('hello');
    expect(isObservable(result.current)).toBe(true);
  });

  test('should merge update to bind', () => {
    const bindFunctions = vitest.spyOn(coreUtils, 'bindFunctions');

    const init = () => ({
      count: 0,
      increment: function (this: { count: number }) {
        this.count++;
      },
    });
    const observed = { count: observable, increment: action };
    const update = ['increment'];

    renderHook(() => useObservableRef(init, observed, update));

    expect(bindFunctions).toHaveBeenCalledTimes(1);
    bindFunctions.mockClear();
  });

  test('should update ref', () => {
    interface Update {
      count: number;
      str?: string;
    }
    const init = () => ({ count: 0 }) as Update;
    const observed = { count: observable };

    const { result, rerender } = renderHook((update: Update) => useObservableRef(init, observed, update));

    expect(result.current.count).toBe(0);

    rerender({ count: 3, str: 'hello' });

    expect(result.current.count).toBe(3);
    expect(result.current.str).toBe('hello');
  });
});
