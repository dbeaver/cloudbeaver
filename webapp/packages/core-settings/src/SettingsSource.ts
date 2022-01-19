/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import type { ISettingsSource } from './ISettingsSource';

export class SettingsSource implements ISettingsSource {
  protected store = new Map<string, any>();

  constructor(protected fallback?: ISettingsSource) {
    makeObservable<this, 'store'>(this, {
      store: observable,
    });
  }

  has(key: string): boolean {
    return this.store.has(key) || !!this.fallback?.has(key);
  }

  getValue(key: string): any | undefined {
    if (this.fallback?.has(key)) {
      return this.fallback.getValue(key);
    }
    return this.store.get(key);
  }

  setValue(key: string, value: any): void {
    this.store.set(key, value);
  }

  clear(): void {
    this.store.clear();
  }
}
