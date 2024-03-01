/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { SessionSettingsService } from '@cloudbeaver/core-root';
import type { ISettingsSource } from '@cloudbeaver/core-settings';

@injectable()
export class ProductSettingsService implements ISettingsSource {
  private readonly settings: Map<string, any>;

  constructor(private readonly sessionSettingsService: SessionSettingsService) {
    this.settings = new Map();
    makeObservable<this, 'settings'>(this, {
      settings: observable,
    });
  }

  has(key: any): boolean {
    return this.settings.has(key) || this.sessionSettingsService?.has(key) || false;
  }

  isReadOnly(): boolean {
    return true;
  }

  getDefaultValue(key: any): any {
    return this.sessionSettingsService.getDefaultValue(key) ?? this.settings.get(key);
  }

  getValue(key: any): any {
    if (this.sessionSettingsService.has(key)) {
      return this.sessionSettingsService.getValue(key);
    }
    return this.settings.get(key);
  }

  setValue(key: any, value: any): void {
    this.settings.set(key, value);
  }

  clear(): void {
    this.settings.clear();
  }
}
