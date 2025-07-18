/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test } from 'vitest';

import { expectDeprecatedSettingMessage, expectNoDeprecatedSettingMessage } from './__custom_mocks__/expectDeprecatedSettingMessage.js';
import { SettingsResolverSource } from './SettingsResolverSource.js';
import { createSettingsLayer, ROOT_SETTINGS_LAYER } from './SettingsLayer.js';
import { createSettingsAliasResolver } from './createSettingsAliasResolver.js';
import { SettingsProvider } from './SettingsProvider.js';
import { schema } from '@cloudbeaver/core-utils';
import { SettingsSource } from './SettingsSource.js';

export class MemorySettingsService extends SettingsSource {
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
        this.setValue(key, null);
      }
    });
  }
}

const MEMORY_SETTINGS_LAYER = createSettingsLayer(ROOT_SETTINGS_LAYER, 'memory');

describe.skip('SettingsResolverSource', () => {
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
    expectNoDeprecatedSettingMessage();
  });

  test('resolves deprecated settings', () => {
    const settingsSchema = schema.object({
      value: schema.string().default(''),
    });
    const memorySettingsSource = new MemorySettingsService();
    const settingsResolver = new SettingsResolverSource();
    settingsResolver.addResolver(MEMORY_SETTINGS_LAYER, memorySettingsSource);
    settingsResolver.addResolver(
      ROOT_SETTINGS_LAYER,
      createSettingsAliasResolver(settingsResolver, new SettingsProvider(settingsResolver, settingsSchema), {
        value: 'deprecated',
      }),
    );

    expect(settingsResolver.has('value')).toBe(false);

    memorySettingsSource.setSettings({
      deprecated: 'value',
    });

    expect(settingsResolver.has('value')).toBe(true);
    expect(settingsResolver.getValue('value')).toBe('value');

    expectDeprecatedSettingMessage('deprecated', 'value');
  });

  test('resolves multiple deprecated settings', () => {
    const settingsSchema = schema.object({
      value: schema.string().default(''),
    });
    const memorySettingsSource = new MemorySettingsService();
    const settingsResolver = new SettingsResolverSource();
    settingsResolver.addResolver(MEMORY_SETTINGS_LAYER, memorySettingsSource);
    settingsResolver.addResolver(
      ROOT_SETTINGS_LAYER,
      createSettingsAliasResolver(settingsResolver, new SettingsProvider(settingsResolver, settingsSchema), {
        value: 'deprecated',
      }),
      createSettingsAliasResolver(settingsResolver, new SettingsProvider(settingsResolver, settingsSchema), {
        value: 'deprecated2',
      }),
    );

    expect(settingsResolver.has('value')).toBe(false);

    memorySettingsSource.setSettings({
      deprecated: 'value',
      deprecated2: 'value2',
    });

    expect(settingsResolver.has('value')).toBe(true);
    expect(settingsResolver.getValue('value')).toBe('value2');

    expectDeprecatedSettingMessage('deprecated2', 'value');
  });
});
