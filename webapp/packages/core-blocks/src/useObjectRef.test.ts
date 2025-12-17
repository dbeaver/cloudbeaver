/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { describe, expect, test } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useObjectRef } from './useObjectRef.js';

interface ITestObject {
  value: number;
  text?: string;
  getValue(): number;
  setValue(value: number): void;
}

function createTestObject(): ITestObject {
  return {
    value: 1,
    text: 'initial',
    getValue() {
      return this.value;
    },
    setValue(value: number) {
      this.value = value;
    },
  };
}

describe('useObjectRef', () => {
  test('returns stable object reference between renders', () => {
    const { result, rerender } = renderHook(() => useObjectRef(createTestObject));

    const firstRef = result.current;
    rerender();
    const secondRef = result.current;

    expect(firstRef).toBe(secondRef);
  });

  test('initializes from object literal and keeps same reference', () => {
    const initObject: ITestObject = createTestObject();

    const { result, rerender } = renderHook(() => useObjectRef(initObject));

    const firstRef = result.current;
    rerender();

    expect(result.current).toBe(firstRef);
    // internal state should keep same reference between renders
    expect(result.current.value).toBe(1);
  });

  test('applies update object on each render', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: number }) =>
        useObjectRef(
          () => ({
            value: 0,
          }),
          {
            value,
          },
        ),
      {
        initialProps: { value: 1 },
      },
    );

    expect(result.current.value).toBe(1);

    rerender({ value: 5 });

    expect(result.current.value).toBe(5);
  });

  test('binds specified methods to object when initialized', () => {
    const { result } = renderHook(() => useObjectRef(createTestObject, false, ['getValue', 'setValue']));

    const ref = result.current;
    const getValue = ref.getValue;
    const setValue = ref.setValue;

    // if binding works, `this` inside methods should point to the ref object
    expect(getValue()).toBe(1);

    setValue(10);
    expect(ref.value).toBe(10);
    expect(getValue()).toBe(10);
  });

  test('binds methods when using bind array as second arg', () => {
    const { result } = renderHook(() => useObjectRef(createTestObject, ['getValue', 'setValue']));

    const ref = result.current;
    const getValue = ref.getValue;
    const setValue = ref.setValue;

    expect(getValue()).toBe(1);
    setValue(3);
    expect(getValue()).toBe(3);
  });

  test('rebinds only methods present in update object', () => {
    const create = () => ({
      value: 1,
      other: 1,
      getValue() {
        return this.value;
      },
      getOther() {
        return this.other;
      },
    });

    const { result, rerender } = renderHook(
      ({ value }: { value: number }) =>
        useObjectRef(
          create,
          {
            value,
          },
          ['getValue', 'getOther'],
        ),
      { initialProps: { value: 1 } },
    );

    const ref = result.current;
    const getValue = ref.getValue;
    const getOther = ref.getOther;

    expect(getValue()).toBe(1);
    expect(getOther()).toBe(1);

    rerender({ value: 10 });

    // getValue should be rebound to updated "value", getOther should still work with old binding
    expect(ref.value).toBe(10);
    expect(getValue()).toBe(10);
    expect(getOther()).toBe(1);
  });

  test('supports partial init and update', () => {
    const { result, rerender } = renderHook(
      ({ text }: { text: string }) => useObjectRef<ITestObject, Partial<ITestObject>>(() => ({ value: 1 }) as ITestObject, { text }),
      { initialProps: { text: 'first' } },
    );

    expect(result.current.value).toBe(1);
    expect(result.current.text).toBe('first');

    rerender({ text: 'second' });

    expect(result.current.text).toBe('second');
  });
});
