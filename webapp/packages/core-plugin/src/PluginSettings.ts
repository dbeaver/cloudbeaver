/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ISettingsSource, SettingsResolverSource } from '@cloudbeaver/core-settings';

export class PluginSettings<T> extends SettingsResolverSource implements ISettingsSource {
  constructor(
    private readonly source: ISettingsSource,
    private readonly scope: string,
    private readonly defaults: T
  ) {
    super();
  }

  has<TKey extends keyof T>(key: TKey): boolean {
    return true;
  }

  isValueDefault<TKey extends keyof T>(key: TKey): boolean {
    return !super.has(key) && !this.source.has(this.scopedKey(key));
  }

  getValue<TKey extends keyof T>(key: TKey): T[TKey] {
    if (super.has(key)) {
      return super.getValue(key);
    }

    if (this.source.has(this.scopedKey(key))) {
      return this.source.getValue(this.scopedKey(key));
    }

    return this.defaults[key];
  }

  setValue<TKey extends keyof T>(key: TKey, value: T[TKey]): void {
    super.setValue(key, value);
    this.source.setValue(this.scopedKey(key), value);
  }

  private scopedKey(key: string | number | symbol): string {
    return `${this.scope}.${String(key)}`;
  }

  clear(): void {
    super.clear();
    this.source.clear();
  }
}
