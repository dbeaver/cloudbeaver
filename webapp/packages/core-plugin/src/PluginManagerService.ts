/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { ProductSettingsService } from '@cloudbeaver/core-product';
import type { SettingsScopeType } from '@cloudbeaver/core-settings';
import type { schema } from '@cloudbeaver/core-utils';

import { PluginSettings } from './PluginSettings';

@injectable()
export class PluginManagerService {
  readonly store: Map<string, PluginSettings>;
  constructor(private readonly productSettingsService: ProductSettingsService) {
    this.store = new Map();
  }

  createSettings<TSchema extends schema.SomeZodObject = schema.AnyZodObject>(scope: string, scopeType: SettingsScopeType, schema: TSchema) {
    const key = scopeType + '.' + scope;
    const settings = new PluginSettings(this.productSettingsService, key, schema);

    this.store.set(key, settings);
    return settings;
  }

  getSettings(id: string): PluginSettings<any> | undefined;
  getSettings(scope: string, scopeType: SettingsScopeType): PluginSettings<any> | undefined;
  getSettings(scope: string, scopeType?: SettingsScopeType): PluginSettings<any> | undefined {
    if (scopeType === undefined) {
      return this.store.get(scope);
    }
    return this.store.get(scopeType + '.' + scope);
  }
}
