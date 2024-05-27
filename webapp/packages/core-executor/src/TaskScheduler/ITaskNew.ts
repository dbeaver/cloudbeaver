/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface ITaskConstructor {
  readonly prototype: ITask<any>;
  new <T>(executor: TaskExecutor<T>): ITask<T>;

  reject<T = never>(reason?: any): ITask<T>;
  cancel<T = never>(reason?: any): ITask<T>;
  resolve(): ITask<void>;
  resolve<T>(value: T): ITask<Awaited<T>>;
  resolve<T>(value: T | PromiseLike<T>): ITask<Awaited<T>>;
  fromPromise<T>(promise: Promise<T>): ITask<T>;
  all<T extends readonly unknown[] | []>(values: T): ITask<{ -readonly [P in keyof T]: Awaited<T[P]> }>;
  allSettled<T extends readonly unknown[] | []>(
    values: T,
  ): ITask<{ -readonly [P in keyof T]: { status: 'fulfilled'; value: Awaited<T[P]> } | { status: 'rejected' | 'cancelled'; reason: any } }>;
}

declare const ITask: ITaskConstructor;

export interface ITask<TValue> extends Promise<TValue>, PromiseLike<TValue> {
  readonly then: <TResult1 = TValue, TResult2 = never, TResult3 = never>(
    onFulfilled?: ((value: TValue) => TResult1 | PromiseLike<TResult1>) | null,
    onRejected?: ((reason: any, cancelled: boolean) => TResult2 | PromiseLike<TResult2>) | null,
  ) => ITask<TResult1 | TResult2 | TResult3>;
  readonly catch: <TResult = never>(
    onRejected?: ((reason: any, cancelled: boolean) => TResult | PromiseLike<TResult>) | null,
  ) => ITask<TValue | TResult>;
  readonly finally: (onfinally?: (() => void) | null) => ITask<TValue>;
  readonly cancel: (reason?: any) => ITask<void>;
}

export type TaskResolveFn<T> = (reason: T | PromiseLike<T>) => void;
export type TaskRejectFn = (reason?: any, cancelled?: boolean) => void;
export type TaskCancelFn = (reason?: any) => ITask<void> | void;

export type TaskExecutor<T> = (resolve: TaskResolveFn<T>, reject: TaskRejectFn, registerCancel: (cancel: TaskCancelFn) => void) => void;
