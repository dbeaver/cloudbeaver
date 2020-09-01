/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface IContextProvider<TData> {
  hasContext(token: IContextLoader<TData>): boolean;
  getContext<T>(token: IContextLoader<T, TData>): Promise<T>;
}

export interface IContextLoader<T = any, TData = any> {
  (contexts: IContextProvider<TData>, data: TData): Promise<T> | T;
}

export class ExecutionContext<TData> implements IContextProvider<TData> {
  private contexts = new Map<IContextLoader<any, TData>, any>()

  constructor(private data: TData) { }

  hasContext(loader: IContextLoader<any>) {
    return this.contexts.has(loader);
  }

  async getContext<T>(token: IContextLoader<T, TData>): Promise<T> {
    if (this.contexts.has(token)) {
      return this.contexts.get(token);
    }
    const value = await token(this, this.data);

    if (value !== null && value !== undefined) {
      this.contexts.set(token, value);
    }
    return value;
  }
}
