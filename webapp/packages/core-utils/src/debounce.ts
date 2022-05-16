/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function debounce<T extends (...args: any[]) => any>(func: T, delay: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  return function (this: ThisParameterType<T>, ...args: Parameters<T>): any {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}