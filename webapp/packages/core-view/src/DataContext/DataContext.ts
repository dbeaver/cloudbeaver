/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import type { DataContextGetter } from './DataContextGetter';
import type { IDataContext } from './IDataContext';
import type { IDataContextProvider } from './IDataContextProvider';

export class DataContext implements IDataContext {
  private map: Map<DataContextGetter<any>, any>;
  fallback?: IDataContextProvider;

  constructor(fallback?: IDataContextProvider) {
    this.map = new Map();
    this.fallback = fallback;

    makeObservable<this, 'map'>(this, {
      map: observable.shallow,
      fallback: observable.ref,
    });
  }

  setFallBack(fallback?: IDataContextProvider): void {
    this.fallback = fallback;
  }

  has(context: DataContextGetter<any>): boolean {
    return this.map.has(context) || this.fallback?.has(context) || false;
  }

  find<T>(context: DataContextGetter<T>, value: T): boolean {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let provider: IDataContextProvider = this;

    while (true) {
      if (this.map.get(context) === value) {
        return true;
      }

      if (provider.fallback) {
        provider = provider.fallback;
      } else {
        return false;
      }
    }
  }

  set<T>(context: DataContextGetter<T>, value: T): this {
    this.map.set(context, value);

    return this;
  }

  delete(context: DataContextGetter<any>): this {
    this.map.delete(context);

    return this;
  }

  get<T>(context: DataContextGetter<T>): T {
    if (!this.map.has(context)) {
      const defaultValue = context();

      if (defaultValue !== undefined) {
        return defaultValue;
      }

      if (this.fallback) {
        return this.fallback.get(context);
      }

      throw new Error('Context doesn\'t exists');
    }

    return this.map.get(context);
  }

  tryGet<T>(context: DataContextGetter<T>): T | undefined {
    if (!this.map.has(context)) {
      if (this.fallback) {
        return this.fallback.tryGet(context);
      }
    }

    return this.map.get(context);
  }
}
