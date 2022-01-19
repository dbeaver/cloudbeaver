/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ISettingsSource } from '@cloudbeaver/core-settings';

export class PluginSettings<T> implements ISettingsSource {
  constructor(
    private source: ISettingsSource,
    private scope: string,
    private defaults: T
  ) {
  }

  has<TKey extends keyof T>(key: TKey): boolean {
    return true;
  }

  getValue<TKey extends keyof T>(key: TKey): T[TKey] {
    if (this.source.has(this.scopedKey(key))) {
      return this.source.getValue(this.scopedKey(key));
    }

    return this.defaults[key];
  }

  setValue<TKey extends keyof T>(key: TKey, value: T[TKey]): void {
    this.source.setValue(this.scopedKey(key), value);
  }

  private scopedKey(key: string | number | symbol): string {
    return `${this.scope}.${String(key)}`;
  }

  clear(): void {
    this.source.clear();
  }
}
