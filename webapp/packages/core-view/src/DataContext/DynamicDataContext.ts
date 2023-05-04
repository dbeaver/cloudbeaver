/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable, observable } from 'mobx';

import type { DataContextGetter } from './DataContextGetter';
import type { DeleteVersionedContextCallback, IDataContext } from './IDataContext';

export class DynamicDataContext implements IDataContext {
  fallback: IDataContext;
  contexts: Map<DataContextGetter<any>, DeleteVersionedContextCallback>;

  get map() {
    return this.fallback.map;
  }

  constructor(fallback: IDataContext) {
    this.fallback = fallback;
    this.contexts = new Map();

    makeObservable(this, {
      fallback: observable.ref,
      flush: action,
      set: action,
    });
  }

  setFallBack(fallback: IDataContext): void {
    if (this.fallback === fallback) {
      return;
    }
    this.flush();
    this.fallback = fallback;
  }

  set<T>(context: DataContextGetter<T>, value: T): DeleteVersionedContextCallback {
    const dynamicContext = this.contexts.get(context);

    if (this.tryGet(context) === value) {
      return dynamicContext ?? (() => {});
    }

    const deleteCallback = this.fallback.set(context, value);
    this.contexts.set(context, deleteCallback);
    return deleteCallback;
  }

  delete(context: DataContextGetter<any>, version?: number): this {
    this.fallback.delete(context, version);
    this.contexts.delete(context);
    return this;
  }

  has(context: DataContextGetter<any>): boolean {
    return this.fallback.has(context);
  }

  get <T>(context: DataContextGetter<T>): T {
    return this.fallback.get(context);
  }

  hasValue <T>(context: DataContextGetter<T>, value: T): boolean {
    return this.fallback.hasValue(context, value);
  }

  find<T>(context: DataContextGetter<T>, predicate: (value: T) => boolean): T | undefined {
    return this.fallback.find(context, predicate);
  }

  tryGet <T>(context: DataContextGetter<T>): T | undefined {
    return this.fallback.tryGet(context);
  }

  flush(): void {
    for (const deleteCallback of this.contexts.values()) {
      deleteCallback();
    }
    this.contexts.clear();
  }
}
