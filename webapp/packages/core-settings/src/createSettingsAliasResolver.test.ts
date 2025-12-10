/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test, beforeEach } from 'vitest';
import { SyncExecutor } from '@cloudbeaver/core-executor';
import type { IEditableSettingsSource } from './IEditableSettingsSource.js';
import {
  expectDeprecatedSettingMessage,
  expectNoDeprecatedSettingMessage,
  addDeprecatedSettingPattern,
} from './__custom_mocks__/expectDeprecatedSettingMessage.js';
import { createSettingsAliasResolver, DEPRECATED_SETTINGS } from './createSettingsAliasResolver.js';
import { initKnownConsoleMessages } from '@cloudbeaver/tests-runner';

const deprecatedSettings = {
  deprecated: 'deprecatedValue',
};

const newSettings = {
  ...deprecatedSettings,
  value: 'value',
};

function createSource(settings: Record<any, any>): IEditableSettingsSource {
  return {
    onChange: new SyncExecutor(),
    has(key: any): boolean {
      return key in settings;
    },
    isEdited(key?: any): boolean {
      return false;
    },
    isReadOnly(key: any): boolean {
      return false;
    },
    getValue(key: any): any | undefined {
      return settings[key];
    },
    getEditedValue(key: any): any | undefined {
      return undefined;
    },
    setValue(key: any, value: any): void {},
    resetValue(key: any): void {},
    async save(): Promise<void> {},
    clear(): void {},
  };
}

function createResolver(settings: Record<any, any>) {
  return createSettingsAliasResolver(createSource(settings), {
    value: 'deprecated',
  });
}

function resetDeprecatedSettings() {
  beforeEach(() => {
    DEPRECATED_SETTINGS.clear();
  });
}

describe('createSettingsAliasResolver', () => {
  initKnownConsoleMessages(addDeprecatedSettingPattern);
  resetDeprecatedSettings();

  test('Deprecated setting ignored', () => {
    const resolver = createResolver(newSettings);

    expect(resolver.has('value')).toBe(false);
    expectNoDeprecatedSettingMessage();
  });

  test('Deprecated setting extracted', () => {
    const resolver = createResolver(deprecatedSettings);

    expect(resolver.has('value')).toBe(true);
    expect(resolver.getValue('value')).toBe('deprecatedValue');
    expectDeprecatedSettingMessage('deprecated', 'value');
  });
});
