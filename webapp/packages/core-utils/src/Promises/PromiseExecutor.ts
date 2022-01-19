/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export type Executor<T> = (
  resolve: (value: T | PromiseLike<T>) => void,
  reject: (reason?: any) => void
) => void;

/**
 * Creates promise that can be resolved or rejected externally by calling resolve and reject methods
 */
export class PromiseExecutor<T> {
  resolve!: (value: T | PromiseLike<T>) => void;
  reject!: (reason: any) => void;
  promise: Promise<T>;

  constructor() {
    const executor: Executor<T> = (resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    };
    this.promise = new Promise<T>(executor);
  }
}
