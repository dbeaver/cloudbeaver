/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import type { IDatabasePersistedStateAction } from '../IDatabasePersistedStateAction.js';
import { validatePersistedState } from '../../../DataViewerTableState/validatePersistedState.js';

export class DatabasePersistedStateAction implements IDatabasePersistedStateAction {
  private store: Record<string, unknown>;
  private readonly source: { options: any };

  constructor(source: { options: any }) {
    this.source = source;
    this.store = {};

    makeObservable<this, 'store'>(this, {
      store: observable.ref,
    });
  }

  setStore(store: Record<string, unknown>): void {
    this.store = store;
    this.applyPersistedConstraints();
  }

  has(key: string): boolean {
    return key in this.store;
  }

  get<T>(key: string): T | undefined {
    return this.store[key] as T | undefined;
  }

  set(key: string, value: unknown): void {
    this.store[key] = value;
  }

  delete(key: string): void {
    delete this.store[key];
  }

  private applyPersistedConstraints(): void {
    const options = this.source.options;

    if (!options || !validatePersistedState(this.store)) {
      return;
    }

    if ('constraints' in options && 'whereFilter' in options) {
      options.constraints = this.store.constraints.map(c => ({
        attributeName: c.attributeName,
        operator: c.operator,
        value: c.value,
        orderAsc: c.orderAsc,
        orderPosition: c.orderPosition,
      }));
      options.whereFilter = this.store.whereFilter || '';
    }
  }
}
