/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import type { schema } from '@cloudbeaver/core-utils';

import { SettingsProvider } from './SettingsProvider';
import { SettingsResolverService } from './SettingsResolverService';
import type { SettingsScopeType } from './SettingsScopeType';

@injectable()
export class SettingsProviderService {
  readonly store: Map<string, SettingsProvider>;
  constructor(private readonly settingsResolverService: SettingsResolverService) {
    this.store = new Map();
  }

  createSettings<TSchema extends schema.SomeZodObject = schema.AnyZodObject>(schema: TSchema, scopeType: SettingsScopeType, scope?: string) {
    const id = getSettingKey(scopeType, scope);

    if (this.store.has(id)) {
      throw new Error('Settings already exists');
    }

    const settings = new SettingsProvider(this.settingsResolverService, id, schema);

    this.store.set(id, settings);
    return settings;
  }

  getSettings(id: string): SettingsProvider<any> | undefined;
  getSettings(scopeType: SettingsScopeType, scope: string): SettingsProvider<any> | undefined;
  getSettings(scopeType: SettingsScopeType | string, scope?: string): SettingsProvider<any> | undefined {
    return this.store.get(getSettingKey(scopeType, scope));
  }
}

export function getSettingKey(scopeType: SettingsScopeType, scope?: string, key?: string) {
  return [scopeType, scope, key].filter(Boolean).join('.');
}
