/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { createSettingsLayer, ISettingsSource, ROOT_SETTINGS_LAYER } from '@cloudbeaver/core-settings';

export const PRODUCT_SETTINGS_LAYER = createSettingsLayer(ROOT_SETTINGS_LAYER, 'product');

@injectable()
export class ProductSettingsService implements ISettingsSource {
  private readonly settings: Map<string, any>;

  constructor() {
    this.settings = new Map();
    makeObservable<this, 'settings'>(this, {
      settings: observable.shallow,
    });
  }

  has(key: any): boolean {
    return this.settings.has(key) || false;
  }

  isEdited(): boolean {
    return false;
  }

  isReadOnly(): boolean {
    return true;
  }

  getEditedValue(key: any): any {
    return this.getValue(key);
  }

  getValue(key: any): any {
    return this.settings.get(key);
  }

  setValue(key: any, value: any): void {
    this.settings.set(key, value);
  }

  clear(): void {
    this.settings.clear();
  }

  async save(): Promise<void> {}
}
