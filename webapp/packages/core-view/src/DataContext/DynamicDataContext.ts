/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable, observable } from 'mobx';

import type { DataContextGetter } from './DataContextGetter';
import type { IDataContext } from './IDataContext';

export class DynamicDataContext implements IDataContext {
  fallback: IDataContext;
  contexts: Array<DataContextGetter<any>>;

  constructor(fallback: IDataContext) {
    this.fallback = fallback;
    this.contexts = [];

    makeObservable(this, {
      fallback: observable.ref,
      flush: action,
      set: action,
    });
  }

  setFallBack(fallback: IDataContext): void {
    this.fallback = fallback;
  }

  set<T>(context: DataContextGetter<T>, value: T): this {
    if (!this.contexts.includes(context)){
      this.contexts.push(context);
    }
    this.fallback.set(context, value);
    return this;
  }

  delete(context: DataContextGetter<any>): this {
    this.fallback.delete(context);
    return this;
  }

  has(context: DataContextGetter<any>): boolean {
    return this.fallback.has(context);
  }

  get <T>(context: DataContextGetter<T>): T {
    return this.fallback.get(context);
  }

  find <T>(context: DataContextGetter<T>, value: T): boolean {
    return this.fallback.find(context, value);
  }

  tryGet <T>(context: DataContextGetter<T>): T | undefined {
    return this.fallback.tryGet(context);
  }

  flush(): void {
    for (const context of this.contexts) {
      this.delete(context);
    }
    this.contexts = [];
  }
}
