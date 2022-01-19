/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IAsyncContextLoader, IContextLoader, IExecutionContext, ISyncContextLoader } from './IExecutionContext';

export class ExecutionContext<TData> implements IExecutionContext<TData> {
  readonly contexts: Map<IContextLoader<any, TData>, any>;

  constructor(private data: TData, context?: IExecutionContext<any>) {
    this.contexts = context?.contexts || new Map<IContextLoader<any, TData>, any>();
  }

  hasContext(loader: IContextLoader<any>): boolean {
    return this.contexts.has(loader);
  }

  getContext<T>(token: ISyncContextLoader<T, TData>): T
  getContext<T>(token: IAsyncContextLoader<T, TData>): Promise<T>
  getContext<T>(token: IContextLoader<T, TData>): Promise<T> | T {
    if (this.contexts.has(token)) {
      return this.contexts.get(token);
    }

    const value = token(this, this.data);

    if (value instanceof Promise) {
      return this.getAsyncContext(token, value);
    }

    this.setContext(token, value);
    return value;
  }

  private async getAsyncContext<T>(token: IContextLoader<T, TData>, promise: Promise<T>) {
    const value = await promise;

    this.setContext(token, value);
    return value;
  }

  private setContext<T>(token: IContextLoader<T, TData>, value: T) {
    if (value !== null && value !== undefined) {
      this.contexts.set(token, value);
    }
  }
}
