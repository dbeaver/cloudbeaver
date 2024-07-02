/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { renderHook } from '@testing-library/react';
import { action, computed, isObservable, observable, runInAction } from 'mobx';

import { useObservableRef } from './useObservableRef';

describe('useObservableRef', () => {
  test('initializes with a function', () => {
    const init = () => ({ count: 0 });
    const observed = { count: observable };

    const { result } = renderHook(() => useObservableRef(init, observed, false));

    expect(result.current.count).toBe(0);
    expect(isObservable(result.current)).toBe(true);
  });

  test('initializes with an object', () => {
    const init = { count: 0 };
    const observed = { count: observable };

    const { result } = renderHook(() => useObservableRef(init, observed));

    expect(result.current.count).toBe(0);
    expect(isObservable(result.current)).toBe(true);
  });

  test('updates the object', () => {
    const init = () => ({ count: 0 });
    const observed = { count: observable };
    const update = { count: 1 };

    const { result } = renderHook(() => useObservableRef(init, observed, update));

    expect(result.current.count).toBe(1);
    expect(isObservable(result.current)).toBe(true);
  });

  test('binds functions', () => {
    const observed = { count: observable, increment: action };

    const { result } = renderHook(() =>
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

    expect(typeof result.current.increment).toBe('function');
    result.current.increment();
    expect(result.current.count).toBe(1);

    const anotherContext = { count: 0, increment: result.current.increment };

    anotherContext.increment();

    expect(anotherContext.count).toBe(0);
    expect(result.current.count).toBe(2);
  });

  test('handles computed properties', () => {
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

  test('handles partial updates', () => {
    const init = () => ({ count: 0, text: 'hello' });
    const observed = { count: observable, text: observable };
    const update = { count: 1 };

    const { result } = renderHook(() => useObservableRef(init, observed, update));

    expect(result.current.count).toBe(1);
    expect(result.current.text).toBe('hello');
    expect(isObservable(result.current)).toBe(true);
  });

  test('handles update as bind array', () => {
    const init = () => ({
      count: 0,
      increment: function (this: { count: number }) {
        this.count++;
      },
    });
    const observed = { count: observable, increment: action };
    const update = ['increment'];

    const { result } = renderHook(() => useObservableRef(init, observed, update));

    expect(typeof result.current.increment).toBe('function');
    result.current.increment();
    expect(result.current.count).toBe(1);

    const anotherContext = { count: 0, increment: result.current.increment };

    anotherContext.increment();

    expect(anotherContext.count).toBe(0);
    expect(result.current.count).toBe(2);
  });
});
