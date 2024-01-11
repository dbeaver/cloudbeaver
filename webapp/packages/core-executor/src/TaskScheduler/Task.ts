/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
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
    if (this.cancelled || (this.externalCancel === undefined && this.executing)) {
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
  private readonly innerPromise: Promise<TValue>;
  private sourcePromise: Promise<TValue> | null;

  get [Symbol.toStringTag](): string {
    return 'Task';
  }

  constructor(readonly task: () => Promise<TValue>, private readonly externalCancel?: () => Promise<void> | void) {
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
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): ITask<TResult1 | TResult2> {
    let cancel = this.cancel.bind(this);

    return new Task(
      async () => {
        const value = await this.innerPromise;

        const task = onfulfilled?.(value);

        if (task instanceof Task) {
          cancel = async () => {
            await task.cancel();
            await this.cancel();
          };
        }

        return (await task) as TResult1;
      },
      () => cancel(),
    )
      .run()
      .catch(onrejected);
  }

  catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null): ITask<TValue | TResult> {
    return new Task(
      async () => {
        try {
          return await this.innerPromise;
        } catch (exception: any) {
          if (onrejected) {
            return await onrejected(exception);
          }
          throw exception;
        }
      },
      () => this.cancel(),
    ).run();
  }

  finally(onfinally?: (() => void) | null): ITask<TValue> {
    return new Task(
      async () => {
        try {
          return await this.innerPromise;
        } finally {
          onfinally?.();
        }
      },
      () => this.cancel(),
    ).run();
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

  async cancel(): Promise<void> {
    if (this.cancelled) {
      return;
    }

    this.cancelled = true;

    if (!this.executing) {
      this.reject(new Error('Task was cancelled'));
      return;
    }

    if (this.externalCancel) {
      await this.externalCancel();
    }

    if (this.sourcePromise instanceof Task) {
      await this.sourcePromise.cancel();
    }
  }
}
