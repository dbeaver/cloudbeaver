/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { CancellablePromise } from './CancellablePromise';

type PromiseExecutor<T> = (
  resolve: (value: T) => void,
  reject: (reason?: any) => void
) => void;

/**
 * wait timeout milliseconds then start to execute promise.
 * During the timeout the execution of promise can be cancelled.
 *
 * @param executor
 * @param timeout
 */
export function deferPromise<T>(executor: PromiseExecutor<T>, timeout: number): CancellablePromise<T> {
  return new CancellablePromise<T>((resolve, reject) => {
    const token = setTimeout(() => executor(resolve, reject), timeout);
    return () => {
      clearTimeout(token);
    };
  });
}

export function cancellableTimeout(timeout: number): CancellablePromise<void> {
  return new CancellablePromise<void>(resolve => {
    const token = setTimeout(() => resolve(), timeout);
    return () => {
      clearTimeout(token);
    };
  });
}
