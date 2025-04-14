/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
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

export function debounceAsync<T extends (...args: any[]) => Promise<any>>(func: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout> | null;

  return function (this: any, ...args: Parameters<T>): Promise<ReturnType<T>> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;

    return new Promise((resolve, reject) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(async () => {
        try {
          const result = await func.apply(context, args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  } as T;
}
