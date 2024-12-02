/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import type { DataContextGetter } from './DataContextGetter.js';
import type { IDataContext } from './IDataContext.js';
import type { IDataContextProvider } from './IDataContextProvider.js';

const NOT_FOUND = Symbol('not found');

export class DataContext implements IDataContext {
  private readonly store: Map<DataContextGetter<unknown>, Map<string, unknown>>;
  private fallback?: IDataContextProvider;

  constructor(fallback?: IDataContextProvider) {
    this.store = new Map();
    this.fallback = fallback;

    makeObservable<this, 'store' | 'fallback'>(this, {
      set: action,
      delete: action,
      clear: action,
      deleteForId: action,
      store: observable.shallow,
      fallback: observable.ref,
    });
  }

  setFallBack(fallback?: IDataContextProvider): void {
    this.fallback = fallback;
  }

  hasOwn(context: DataContextGetter<any>): boolean {
    return this.store.has(context);
  }

  has(context: DataContextGetter<any>): boolean {
    return this.hasOwn(context) || this.fallback?.has(context) || false;
  }

  hasOwnValue<T>(context: DataContextGetter<T>, value: T): boolean {
    return this.getOwn(context) === value;
  }

  hasValue<T>(context: DataContextGetter<T>, value: T): boolean {
    return this.hasOwnValue(context, value) || this.fallback?.hasOwnValue(context, value) || false;
  }

  find<T>(context: DataContextGetter<T>, predicate: (value: T) => boolean): T | undefined {
    const value = this.internalGet(context);

    if (value !== NOT_FOUND && predicate(value)) {
      return value;
    }

    if (this.fallback) {
      return this.fallback.find(context, predicate);
    }

    return undefined;
  }

  set<T>(context: DataContextGetter<T>, value: T, id: string): this {
    let data = this.store.get(context);

    if (!data) {
      data = observable(new Map(), { deep: false });
      this.store.set(context, data);
    }

    data.set(id, value);
    return this;
  }

  delete(context: DataContextGetter<any>, id?: string): this {
    if (id) {
      const data = this.store.get(context);
      data?.delete(id);

      if (data?.size) {
        return this;
      }
    }
    this.store.delete(context);

    return this;
  }

  deleteForId(id: string): this {
    for (const [context, data] of this.store) {
      data.delete(id);

      if (data.size === 0) {
        this.store.delete(context);
      }
    }

    return this;
  }

  getOwn<T>(context: DataContextGetter<T>): T | undefined {
    const value = this.internalGet(context);

    if (value === NOT_FOUND) {
      return undefined;
    }

    return value;
  }

  get<T>(context: DataContextGetter<T>): T | undefined {
    const value = this.internalGet(context);

    if (value === NOT_FOUND && this.fallback) {
      return this.fallback.get(context);
    }

    if (value === NOT_FOUND) {
      return undefined;
    }

    return value;
  }

  clear(): void {
    this.store.clear();
  }

  private internalGet<T>(context: DataContextGetter<T>): T | typeof NOT_FOUND {
    const data = this.store.get(context);

    if (data?.size) {
      return [...data.values()][data.size - 1] as T;
    }

    return NOT_FOUND;
  }
}
