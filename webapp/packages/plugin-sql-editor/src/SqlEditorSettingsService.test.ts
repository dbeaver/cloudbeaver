/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { type ServerConfigResource, type ServerSettingsManagerService, SettingsTransformationService } from '@cloudbeaver/core-root';
import { ObjectPropertyLength } from '@cloudbeaver/core-sdk';
import {
  ESettingsValueType,
  SettingsManagerService,
  SettingsProviderService,
  SettingsResolverService,
  UserSettingsResolverService,
} from '@cloudbeaver/core-settings';

import { SQL_EDITOR_SETTINGS_GROUP } from './SQL_EDITOR_SETTINGS_GROUP.js';
import { SqlEditorSettingsService } from './SqlEditorSettingsService.js';

const KEY = 'script.sql.delimiter.blank';

function setup(providedSettings = new Set<string>()) {
  const resolver = new SettingsResolverService();
  const provider = new SettingsProviderService(resolver, new UserSettingsResolverService());
  const manager = new SettingsManagerService();
  const transformation = new SettingsTransformationService();
  const service = new SqlEditorSettingsService(
    provider,
    manager,
    resolver,
    transformation,
    { providedSettings } as ServerSettingsManagerService,
    { isFeatureEnabled: () => false } as unknown as ServerConfigResource,
  );
  return { service, manager, transformation };
}

describe('SQL editor blank line delimiter setting', () => {
  it('exposes a server-backed preference with the backend modes and default', () => {
    const { service, manager } = setup();
    const setting = manager.activeSettings.find(setting => setting.key === KEY);

    expect(setting).toMatchObject({
      group: SQL_EDITOR_SETTINGS_GROUP,
      type: ESettingsValueType.Select,
      access: { scope: ['server', 'client'] },
    });
    expect(setting?.options?.map(option => option.value)).toEqual(['BLANK_LINE_AND_SEPARATOR', 'ONLY_SEPARATOR', 'SMART']);
    expect(service.settings.getValue(KEY)).toBe('BLANK_LINE_AND_SEPARATOR');
  });

  it('localizes a server-provided preference without registering a duplicate', () => {
    const { manager, transformation } = setup(new Set([KEY]));

    expect(manager.activeSettings.filter(setting => setting.key === KEY)).toEqual([]);
    expect(
      transformation.mapSetting(new Map(), {
        id: KEY,
        scopes: ['user'],
        allowCustomValue: false,
        features: [],
        length: ObjectPropertyLength.Long,
        order: 0,
        required: false,
      }),
    ).toMatchObject({
      key: KEY,
      group: SQL_EDITOR_SETTINGS_GROUP,
      type: ESettingsValueType.Select,
      access: { scope: ['client'] },
      name: 'sql_editor_settings_blank_line_delimiter_name',
      options: expect.arrayContaining([{ value: 'ONLY_SEPARATOR', name: 'sql_editor_settings_blank_line_delimiter_never' }]),
    });
  });
});
