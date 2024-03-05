/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable, runInAction } from 'mobx';

const NOT_INITIALIZED_SYMBOL = Symbol('NOT_INITIALIZED_SYMBOL');

export interface ICachedValueObject<T> {
  readonly invalid: boolean;
  value(getter: () => T): T;
  invalidate(): void;
}

export function cacheValue<T>(): ICachedValueObject<T> {
  const state = observable(
    {
      invalid: true,
      value: NOT_INITIALIZED_SYMBOL as T | typeof NOT_INITIALIZED_SYMBOL,
    },
    {
      value: observable.ref,
    },
  );

  return {
    value(getter: () => T) {
      if (state.invalid || state.value === NOT_INITIALIZED_SYMBOL) {
        runInAction(() => {
          state.value = getter();
          state.invalid = false;
        });
      }
      return state.value as T;
    },
    get invalid() {
      return state.invalid;
    },
    invalidate() {
      state.invalid = true;
    },
  };
}
