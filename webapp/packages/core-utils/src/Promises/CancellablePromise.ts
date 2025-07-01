/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { PromiseCancelledError } from './PromiseCancelledError.js';

export type CancellableExecutor<T> = (resolve: (value: T) => void, reject: (reason?: any) => void) => undefined | (() => void); // returns nothing or cancel function

/**
 * When cancelled the promise will be rejected with the reason PROMISE_CANCELLED
 *
 * 'then' method returns the ordinary promise
 */
export class CancellablePromise<T> extends Promise<T> {
  private readonly _resolve: (value: T | PromiseLike<T>) => void;
  private readonly _reject: (reason?: any) => void;
  private readonly _cancel?: () => void;

  constructor(executor: CancellableExecutor<T>) {
    let _resolve!: (value: T | PromiseLike<T>) => void;
    let _reject!: (reason?: any) => void;
    super((resolve, reject) => {
      _resolve = resolve;
      _reject = reject;
    });
    this._resolve = _resolve;
    this._reject = _reject;
    try {
      this._cancel = executor(this._resolve, this._reject);
    } catch (e: any) {
      this._reject(e);
    }
  }

  cancel() {
    if (this._cancel) {
      this._cancel();
    }
    this._reject(new PromiseCancelledError('Promise cancelled'));
  }
}
