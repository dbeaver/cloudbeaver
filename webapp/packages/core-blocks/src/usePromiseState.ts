/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, observable } from 'mobx';
import { useEffect } from 'react';

import { Task } from '@cloudbeaver/core-executor';
import { type ILoadableState, isContainsException } from '@cloudbeaver/core-utils';

import { useObservableRef } from './useObservableRef.js';

export function usePromiseState<T>(promise: Promise<T> | null): ILoadableState {
  const state = useObservableRef(
    () => ({
      exception: null,
      loading: true,
      get cancel() {
        if (this.promise instanceof Task && this.promise.cancellable) {
          return this.promise.cancel.bind(this.promise);
        }
        return undefined;
      },
      isError() {
        return isContainsException(this.exception);
      },
      isCancelled(): boolean {
        if (this.promise instanceof Task) {
          return this.promise.cancelled;
        }
        return false;
      },
      isLoading(): boolean {
        if (this.promise instanceof Task) {
          return this.promise.executing;
        }
        return this.promise !== null && this.loading;
      },
      isLoaded(): boolean {
        return this.promise === null;
      },
      load() {},
    }),
    {
      cancel: computed,
      promise: observable.ref,
      exception: observable.ref,
      loading: observable.ref,
    },
    { promise },
  );

  useEffect(() => {
    if (promise) {
      state.loading = true;
      state.exception = null;

      promise
        .catch(exception => {
          if (promise === state.promise) {
            state.exception = exception;
          }
        })
        .finally(() => {
          if (promise === state.promise) {
            state.loading = false;
          }
        });
    }
  }, [promise]);

  return state;
}
