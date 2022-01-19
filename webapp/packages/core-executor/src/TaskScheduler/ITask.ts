/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface ITask<TValue> extends Promise<TValue> {
  readonly cancelled: boolean;
  readonly executing: boolean;
  readonly cancellable: boolean;
  readonly run: () => this;
  readonly cancel: () => Promise<void> | void;

  then: <TResult1 = TValue, TResult2 = never>(
    onfulfilled?: ((value: TValue) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ) => ITask<TResult1 | TResult2>;
  catch: <TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ) => ITask<TValue | TResult>;
  finally: (onfinally?: (() => void) | null) => ITask<TValue>;
}
