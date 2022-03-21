/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable, observable } from 'mobx';

import type { ITask } from './ITask';

export class Task<TValue> implements ITask<TValue> {
  cancelled: boolean;
  executing: boolean;

  get cancellable(): boolean {
    if (
      this.cancelled
      || (this.externalCancel === undefined && this.executing)
    ) {
      return false;
    }

    if (this.externalCancel !== undefined) {
      return true;
    }

    if (this.sourcePromise instanceof Task) {
      return this.sourcePromise.cancellable;
    }

    return false;
  }

  private resolve!: (value: TValue) => void;
  private reject!: (reason?: any) => void;
  private innerPromise: Promise<TValue>;
  private sourcePromise: Promise<TValue> | null;

  get [Symbol.toStringTag](): string {
    return 'Task';
  }

  constructor(
    readonly task: () => Promise<TValue>,
    private externalCancel?: () => Promise<void> | void
  ) {
    this.innerPromise = new Promise((resolve, reject) => {
      this.reject = reject;
      this.resolve = resolve;
    });
    this.sourcePromise = null;
    this.cancelled = false;
    this.executing = false;

    makeObservable<this, 'sourcePromise'>(this, {
      cancellable: computed,
      cancelled: observable,
      executing: observable,
      sourcePromise: observable.ref,
    });
  }

  then<TResult1 = TValue, TResult2 = never>(
    onfulfilled?: ((value: TValue) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): ITask<TResult1 | TResult2> {
    return new Task(async () => {
      try {
        const value = await this.innerPromise;
        return await onfulfilled?.(value) as TResult1;
      } catch (e: any) {
        if (onrejected) {
          return await onrejected(e);
        }
        throw e;
      }
    }, () => this.cancel()).run();
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): ITask<TValue | TResult> {
    return new Task(async () => {
      try {
        return await this.innerPromise;
      } catch (exception: any) {
        if (onrejected) {
          return await onrejected(exception);
        }
        throw exception;
      }
    }, () => this.cancel()).run();
  }

  finally(onfinally?: (() => void) | null): ITask<TValue> {
    return new Task(async () => {
      try {
        return await this.innerPromise;
      } finally {
        onfinally?.();
      }
    }, () => this.cancel()).run();
  }

  run(): this {
    if (this.cancelled) {
      return this;
    }

    if (this.executing) {
      throw new Error('Task already executing');
    }

    this.executing = true;

    this.sourcePromise = this.task();
    this.sourcePromise
      .then(value => this.resolve(value))
      .catch(reason => this.reject(reason))
      .finally(() => {
        this.executing = false;
        this.sourcePromise = null;
      });

    return this;
  }

  cancel(): Promise<void> | void {
    if (this.cancelled) {
      return;
    }

    this.cancelled = true;

    if (!this.executing) {
      this.reject(new Error('Task was cancelled'));
      return;
    }

    if (this.externalCancel) {
      return this.externalCancel();
    }

    if (this.sourcePromise instanceof Task) {
      return this.sourcePromise.cancel();
    }
  }
}
