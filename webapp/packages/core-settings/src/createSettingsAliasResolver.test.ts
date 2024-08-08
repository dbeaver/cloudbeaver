/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { expect, test } from '@jest/globals';

import { SyncExecutor } from '@cloudbeaver/core-executor';

import { expectDeprecatedSettingMessage, expectNoDeprecatedSettingMessage } from './__custom_mocks__/expectDeprecatedSettingMessage';
import { createSettingsAliasResolver } from './createSettingsAliasResolver';
import type { ISettingsSource } from './ISettingsSource';

const deprecatedSettings = {
  deprecated: 'deprecatedValue',
};

const newSettings = {
  ...deprecatedSettings,
  value: 'value',
};

function createSource(settings: Record<any, any>): ISettingsSource {
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
    async save(): Promise<void> {},
    clear(): void {},
  };
}

function createResolver(settings: Record<any, any>) {
  return createSettingsAliasResolver(createSource(settings), null as any, {
    value: 'deprecated',
  });
}

test('Deprecated setting ignored', async () => {
  const resolver = createResolver(newSettings);

  expect(resolver.has('value')).toBe(false);
  expectNoDeprecatedSettingMessage();
});

test('Deprecated setting extracted', async () => {
  const resolver = createResolver(deprecatedSettings);

  expect(resolver.has('value')).toBe(true);
  expect(resolver.getValue('value')).toBe('deprecatedValue');
  expectDeprecatedSettingMessage('deprecated', 'value');
});
