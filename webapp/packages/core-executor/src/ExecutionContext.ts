/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IAsyncContextLoader, IContextLoader, IExecutionContext, ISyncContextLoader } from './IExecutionContext.js';

export class ExecutionContext<TData> implements IExecutionContext<TData> {
  readonly contexts: Map<IContextLoader<any, TData>, any>;
  readonly contextCreators: Map<IContextLoader<any, TData>, IContextLoader<any, TData>>;

  constructor(
    private readonly data: TData,
    context?: IExecutionContext<any>,
  ) {
    this.contexts = context?.contexts || new Map();
    this.contextCreators = context?.contextCreators ?? new Map();
  }

  addContextCreators(creators: [IContextLoader<any, TData>, IContextLoader<any, TData>][]): void {
    for (const [key, value] of creators) {
      this.contextCreators.set(key, value);
    }
  }

  hasContext(loader: IContextLoader): boolean {
    return this.contextCreators.has(loader) || this.contexts.has(loader);
  }

  getContext<T>(token: ISyncContextLoader<T, TData>): T;
  getContext<T>(token: IAsyncContextLoader<T, TData>): Promise<T>;
  getContext<T>(token: IContextLoader<T, TData>): Promise<T> | T {
    if (this.contexts.has(token)) {
      return this.contexts.get(token);
    }

    let value: T | Promise<T>;

    if (this.contextCreators.has(token)) {
      value = this.contextCreators.get(token)!(this, this.data);
    } else {
      value = token(this, this.data);
    }

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
