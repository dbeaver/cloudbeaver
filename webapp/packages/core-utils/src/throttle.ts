/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function throttle<T extends (...args: any[]) => void | Promise<void>>(f: T, delay: number): T {
  let throttle = false;
  let pending = false;
  let functionArgs: any[] = [];
  let thisObject: any;

  return function exec(this: any, ...args: any[]) {
    if (throttle) {
      functionArgs = args;
      thisObject = this;
      pending = true;
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
