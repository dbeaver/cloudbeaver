/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { MetadataMap } from '@cloudbeaver/core-utils';

import { DataContext } from './DataContext';
import type { DataContextGetter } from './DataContextGetter';
import type { DeleteVersionedContextCallback, IDataContext } from './IDataContext';
import type { IDataContextProvider } from './IDataContextProvider';

export class TempDataContext implements IDataContext {
  readonly map: Map<DataContextGetter<any>, any>;
  private readonly versions: MetadataMap<DataContextGetter<any>, number>;
  target: IDataContext;
  fallback?: IDataContextProvider;
  private flushTimeout: any;

  constructor(fallback?: IDataContextProvider) {
    this.map = new Map();
    this.versions = new MetadataMap(() => 0);
    this.target = new DataContext(fallback);
    this.fallback = fallback;

    makeObservable<this>(this, {
      map: observable.shallow,
      target: observable.ref,
      set: action,
      delete: action,
      clear: action,
      flush: action,
    });
  }

  setFallBack(fallback?: IDataContextProvider): void {
    this.fallback = fallback;
    this.planFlush();
  }

  hasOwn(context: DataContextGetter<any>): boolean {
    return this.map.has(context) || this.target.hasOwn(context);
  }

  has(context: DataContextGetter<any>, nested = true): boolean {
    if (this.hasOwn(context)) {
      return true;
    }

    if (nested && this.fallback?.has(context)) {
      return true;
    }

    return false;
  }

  hasValue<T>(context: DataContextGetter<T>, value: T, nested = true): boolean {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let provider: IDataContextProvider = this;

    while (true) {
      if (provider.getOwn(context) === value) {
        return true;
      }

      if (provider.fallback && nested) {
        provider = provider.fallback;
      } else {
        return false;
      }
    }
  }

  find<T>(context: DataContextGetter<T>, predicate: (value: T) => boolean): T | undefined {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let provider: IDataContextProvider = this;

    while (true) {
      if (provider.hasOwn(context)) {
        const value = provider.getOwn(context)!;

        if (predicate(value)) {
          return value;
        }
      }

      if (provider.fallback) {
        provider = provider.fallback;
      } else {
        return undefined;
      }
    }
  }

  getOwn<T>(context: DataContextGetter<T>): T | undefined {
    if (this.map.has(context)) {
      return this.map.get(context);
    }

    return this.target.getOwn(context);
  }

  set<T>(context: DataContextGetter<T>, value: T): DeleteVersionedContextCallback {
    const data = this.getOwn(context);
    let version = this.versions.get(context);

    if (data === value) {
      return this.delete.bind(this, context, version);
    }

    version++;
    this.map.set(context, value);
    this.versions.set(context, version);
    this.planFlush();

    return this.delete.bind(this, context, version);
  }

  delete(context: DataContextGetter<any>, version?: number): this {
    if (version !== this.versions.get(context)) {
      return this;
    }

    this.map.delete(context);
    this.planFlush();

    return this;
  }

  get<T>(context: DataContextGetter<T>): T {
    if (!this.hasOwn(context)) {
      const defaultValue = context(this);

      if (defaultValue !== undefined) {
        this.set(context, defaultValue);
        return defaultValue;
      }

      if (this.fallback) {
        return this.fallback.get(context);
      }

      throw new Error("Context doesn't exists");
    }

    return this.getOwn(context)!;
  }

  tryGet<T>(context: DataContextGetter<T>): T | undefined {
    if (!this.hasOwn(context)) {
      if (this.fallback) {
        return this.fallback.tryGet(context);
      }
    }

    return this.getOwn(context);
  }

  clear(): void {
    this.map.clear();
    this.versions.clear();
    this.planFlush();
  }

  flush(): void {
    clearTimeout(this.flushTimeout);
    this.target.clear();
    this.target.setFallBack(this.fallback);

    for (const [key, value] of this.map) {
      this.target.set(key, value);
    }
  }

  private planFlush(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }

    this.flushTimeout = setTimeout(() => {
      this.flush();
    }, 0);
  }
}
