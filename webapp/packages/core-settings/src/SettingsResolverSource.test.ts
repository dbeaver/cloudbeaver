/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test } from 'vitest';

import { SettingsResolverSource } from './SettingsResolverSource.js';
import { createSettingsLayer, ROOT_SETTINGS_LAYER } from './SettingsLayer.js';
import { EditableSettingsSource } from './EditableSettingsSource.js';

export class MemorySettingsService extends EditableSettingsSource {
  private readonly settings: Map<string, any>;

  constructor() {
    super();
    this.settings = new Map();
  }

  setSettings(settings: Record<string, any>) {
    this.update(() => {
      this.clear();
      this.settings.clear();

      for (const [key, value] of Object.entries(settings)) {
        this.settings.set(key, value);
      }
    });
  }

  override has(key: any): boolean {
    return this.settings.has(key) || super.has(key);
  }

  isOverrideDefaults(): boolean {
    return this.settings.size > 0;
  }

  isReadOnly(key: any): boolean {
    return false;
  }

  getValue(key: any): any {
    return this.settings.get(key);
  }

  async save() {}

  protected getSnapshot() {
    return Object.fromEntries(this.settings);
  }

  restoreDefaults() {
    this.update(() => {
      this.clear();
      for (const key of this.settings.keys()) {
        this.resetValue(key);
      }
    });
  }
}

const MEMORY_SETTINGS_LAYER = createSettingsLayer(ROOT_SETTINGS_LAYER, 'memory');

describe('SettingsResolverSource', () => {
  test('resolves setting from source', () => {
    const memorySettingsSource = new MemorySettingsService();
    const settingsResolver = new SettingsResolverSource();
    settingsResolver.addResolver(MEMORY_SETTINGS_LAYER, memorySettingsSource);

    memorySettingsSource.setSettings({
      value: 'value',
    });

    expect(settingsResolver.has('value')).toBe(true);
    expect(settingsResolver.getValue('value')).toBe('value');

    expect(settingsResolver.has('unknown_value')).toBe(false);
    expect(settingsResolver.getValue('unknown_value')).toBe(undefined);
  });
});
