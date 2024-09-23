/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { CancelError } from './CancelError.js';
import type { ITask, TaskCancelFn, TaskExecutor, TaskRejectFn, TaskResolveFn } from './ITaskNew.js';

export const NOOP: VoidFunction = Object.freeze(() => {});

// experimental cancellable promise implementation
export class Task<T> implements ITask<T> {
  get [Symbol.toStringTag](): string {
    return 'Task';
  }

  protected status: 'pending' | 'fulfilled' | 'rejected';
  private value: any;
  private fulfillCallbacks: Array<(value: T | PromiseLike<T>) => void>;
  private rejectCallbacks: Array<(reason?: any, cancelled?: boolean) => void>;
  private cancelling: boolean;
  private cancelCallback: TaskCancelFn;
  private parentTask: Task<any> | null;

  constructor(executor: TaskExecutor<T>) {
    this.status = 'pending';
    this.internalCancel = this.internalCancel.bind(this);
    this.internalResolve = this.internalResolve.bind(this);
    this.internalReject = this.internalReject.bind(this);
    this.registerCancel = this.registerCancel.bind(this);
    this.cancel = this.cancel.bind(this);

    this.fulfillCallbacks = [];
    this.rejectCallbacks = [];
    this.cancelCallback = this.internalCancel;
    this.cancelling = false;
    this.parentTask = null;

    try {
      executor(this.internalResolve, this.internalReject, this.registerCancel);
    } catch (err) {
      this.internalReject(err);
    }
  }

  then<TResult1 = T, TResult2 = never>(
    onFulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onRejected?: ((reason: any, cancelled: boolean) => TResult2 | PromiseLike<TResult2>) | null,
  ): Task<TResult1 | TResult2> {
    const task = new Task<TResult1 | TResult2>(NOOP);

    task.parentTask = this;

    this.subscribeResolve(value => {
      queueMicrotask(() => {
        if (typeof onFulfilled !== 'function') {
          task.internalResolve(value as TResult1);
          return;
        }

        console.warn('generate microtask');
        this.executeValue(
          value,
          value => {
            this.resolvePromise(task, onFulfilled(value as any));
            // this.promiseResolution(task, onFulfilled(value as any), resolve, reject, registerCancel);
          },
          task.internalReject,
        );
      });
    });

    this.subscribeReject((reason, cancelled) => {
      queueMicrotask(() => {
        if (typeof onRejected !== 'function') {
          task.internalReject(reason, cancelled);
          return;
        }

        console.warn('generate microtask');
        this.executeValue(
          reason,
          (reason: any) => {
            this.resolvePromise(task, onRejected(reason, cancelled ?? false) as TResult2);
            // this.promiseResolution(task, onRejected(reason, cancelled ?? false) as TResult2, resolve, reject, registerCancel);
          },
          task.internalReject,
        );
      });
    });

    return task;
  }

  catch<TResult = never>(onRejected?: ((reason: any, cancelled: boolean) => TResult | PromiseLike<TResult>) | null): Task<T | TResult> {
    return this.then(undefined, onRejected);
  }

  finally(onFinally?: (() => void) | null): Task<T> {
    return this.then(
      value => {
        onFinally?.();
        return value;
      },
      reason => {
        onFinally?.();
        throw reason;
      },
    );
  }

  cancel(reason?: any): Task<void> {
    if (this.cancelling) {
      throw new Error('Task is already cancelling');
    }
    this.cancelling = true;

    if (this.parentTask && this.parentTask.status === 'pending') {
      return this.parentTask.cancel(reason).finally(() => {
        this.cancelling = false;
      });
    }

    return Task.resolve(this.cancelCallback(reason)).finally(() => {
      this.cancelling = false;
    });
  }

  protected internalCancel(reason?: any): void {
    this.internalReject(reason, true);
  }

  protected internalResolve(value: T | PromiseLike<T>) {
    if (this.status === 'pending') {
      this.status = 'fulfilled';
      this.value = value;

      this.executeTasks(this.fulfillCallbacks, value, undefined);
    }
  }

  protected internalReject(reason?: any, cancelled?: boolean) {
    if (this.status === 'pending') {
      cancelled ||= reason instanceof CancelError;
      if (cancelled && !(reason instanceof CancelError)) {
        reason = new CancelError(reason, { cause: reason });
      }
      this.status = 'rejected';
      this.value = reason;

      this.executeTasks(this.rejectCallbacks, reason, cancelled);
    }
  }

  executeTasks<T>(tasks: ((value: T, cancelled?: boolean) => void)[], value: T, cancelled: any) {
    this.fulfillCallbacks = [];
    this.rejectCallbacks = [];
    this.cancelCallback = this.internalCancel;

    for (const onRejectedCallback of tasks) {
      onRejectedCallback(value, cancelled);
    }
  }

  private registerCancel(cancel: TaskCancelFn): void {
    let copy = this.cancelCallback;
    if (copy === this.internalCancel) {
      copy = NOOP;
    }

    this.cancelCallback = reason => Task.resolve(copy(reason)).then(() => cancel(reason));
  }

  private subscribeResolve(resolve: TaskResolveFn<T>): void {
    switch (this.status) {
      case 'pending':
        {
          this.fulfillCallbacks.push(resolve);
        }
        break;
      case 'fulfilled':
        resolve(this.value);
        break;
    }
  }

  private subscribeReject(reject: TaskRejectFn): void {
    switch (this.status) {
      case 'pending':
        {
          this.rejectCallbacks.push(reject);
        }
        break;
      case 'rejected':
        reject(this.value, this.value instanceof CancelError);
        break;
    }
  }

  static reject<T = never>(reason?: any): Task<T> {
    return new Task<T>((_, reject) => {
      reject(reason);
    });
  }

  static resolve(): Task<void>;
  static resolve<T>(value: T): Task<Awaited<T>>;
  static resolve<T>(value: T | PromiseLike<T>): Task<Awaited<T>>;
  static resolve<T = void>(value?: T | PromiseLike<T>): Task<Awaited<T>> {
    if (isPromiseLike(value)) {
      return value as Task<Awaited<T>>;
    } else {
      return new Task(resolve => {
        resolve(value as any);
      });
    }
  }

  static cancel<T = never>(reason?: any): Task<T> {
    return new Task<T>((_, reject) => {
      reject(reason, true);
    });
  }

  static fromPromise<T>(promise: PromiseLike<T>): Task<T> {
    return new Task<T>((resolve, reject) => {
      promise.then(resolve, reject);
    });
  }

  static all<T extends readonly unknown[] | []>(values: T): Task<{ -readonly [P in keyof T]: Awaited<T[P]> }> {
    return new Task((resolve, reject) => {
      let counter = 0;
      const result = [] as { -readonly [P in keyof T]: Awaited<T[P]> };

      if (values.length === 0) {
        resolve([] as any);
        return;
      }

      for (let i = 0; i < values.length; i++) {
        Task.resolve(values[i]).then(
          res => {
            result[i] = res;
            counter += 1;
            if (counter === values.length) {
              resolve(result);
            }
          },
          reason => {
            reject(reason);
          },
        );
      }
    });
  }

  static allSettled<T extends readonly unknown[] | []>(
    values: T,
  ): Task<{ -readonly [P in keyof T]: { status: 'fulfilled'; value: Awaited<T[P]> } | { status: 'rejected' | 'cancelled'; reason: any } }> {
    return new Task(resolve => {
      let counter = 0;
      const result = [] as {
        -readonly [P in keyof T]: { status: 'fulfilled'; value: Awaited<T[P]> } | { status: 'rejected' | 'cancelled'; reason: any };
      };

      if (values.length === 0) {
        resolve([] as any);
        return;
      }

      for (let i = 0; i < values.length; i++) {
        Task.resolve(values[i]).then(
          res => {
            result[i] = { status: 'fulfilled', value: res };
            counter += 1;
            if (counter === values.length) {
              resolve(result);
            }
          },
          (reason, cancelled) => {
            result[i] = { status: cancelled ? 'cancelled' : 'rejected', reason };
            counter += 1;
            if (counter === values.length) {
              resolve(result);
            }
          },
        );
      }
    });
  }

  private resolvePromise<T>(promise: Task<any>, value: T | PromiseLike<T>): void {
    this.executeValue(
      value,
      value => {
        if (parent === value) {
          throw new TypeError('Cannot resolve task with itself');
        }

        if (value instanceof Task || value instanceof Promise) {
          if (value instanceof Task) {
            promise.registerCancel(reason => value.cancel(reason));
          }
          value.then(promise.internalResolve, promise.internalReject);
          return;
        }

        if (value && (typeof value === 'object' || typeof value === 'function')) {
          const then = (value as PromiseLike<any>).then;

          if (typeof then === 'function') {
            (then as (...args: any[]) => any).call(
              value,
              (r: any) => {
                promise.resolvePromise(value as any, r);
              },
              promise.internalReject,
            );
            return;
          }
        }

        promise.internalResolve(value);
      },
      promise.internalReject,
    );
  }

  private promiseResolution<T>(
    parent: Task<any>,
    value: T | PromiseLike<T>,
    resolve: (value: T) => void,
    reject: TaskRejectFn,
    registerCancel: (cancel: TaskCancelFn) => void,
  ): void {
    this.executeValue(
      value,
      value => {
        if (parent === value) {
          throw new TypeError('Cannot resolve task with itself');
        }

        if (value instanceof Task || value instanceof Promise) {
          if (value instanceof Task) {
            registerCancel(reason => value.cancel(reason));
          }
          value.then(resolve, reject);
          return;
        }

        if (value && (typeof value === 'object' || typeof value === 'function')) {
          const then = (value as PromiseLike<any>).then;

          if (typeof then === 'function') {
            (then as (...args: any[]) => any).call(
              value,
              (r: any) => {
                this.promiseResolution(value as any, r, resolve, reject, registerCancel);
              },
              reject,
            );
            return;
          }
        }

        resolve(value as any);
      },
      reject,
    );
  }

  private executeValue<T>(value: T, resolve: (value: T) => void, reject: TaskRejectFn) {
    try {
      resolve(value);
    } catch (err) {
      reject(err, err instanceof CancelError);
    }
  }
}

function isPromiseLike<T>(value: any): value is PromiseLike<T> {
  return value && typeof value === 'object' && 'then' in value;
}
