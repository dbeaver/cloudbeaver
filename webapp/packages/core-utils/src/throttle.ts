/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

type ThrottleAsync<TResult, TArguments extends any[]> = (...args: TArguments) => Promise<TResult>;

export function throttle<T extends (...args: any[]) => void | Promise<void>>(f: T, delay: number, tail = true): T {
  let throttle = false;
  let pending = false;
  let functionArgs: any[] = [];
  let thisObject: any;

  return function exec(this: any, ...args: any[]) {
    if (throttle) {
      if (tail) {
        functionArgs = args;
        thisObject = this;
        pending = true;
      }
      return;
    }

    throttle = true;

    try {
      f.apply(this, args);
    } finally {
      setTimeout(() => {
        throttle = false;

        if (pending) {
          f.apply(thisObject, functionArgs);
          thisObject = null;
          functionArgs = [];
          pending = false;
        }
      }, delay);
    }
  } as T;
}

export function throttleAsync<
  TResult,
  TArguments extends any[],
  T extends (...args: TArguments) => Promise<TResult>
>(f: T, delay: number): ThrottleAsync<TResult, TArguments> {
  let throttle = false;
  let _resolve: ((result: TResult) => void) | null = null;
  let _reject: ((reason?: any) => void) | null = null;
  let functionArgs: TArguments | null = null;
  let thisObject: any;

  return async function exec(this: any, ...args: TArguments): Promise<TResult> {
    if (throttle) {
      functionArgs = args;
      thisObject = this;

      if (_reject) {
        _reject();
      }

      return new Promise<TResult>((resolve, reject) => {
        _resolve = resolve;
        _reject = reject;
      });
    }

    throttle = true;

    try {
      return f.apply(this, args);
    } finally {
      setTimeout(() => {
        throttle = false;

        if (functionArgs) {
          f.apply(thisObject, functionArgs)
            .then(_resolve)
            .catch(_reject);

          _resolve = null;
          _reject = null;
          thisObject = null;
          functionArgs = null;
        }
      }, delay);
    }
  };
}
