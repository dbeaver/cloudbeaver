/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { ProductManagerService } from '@cloudbeaver/core-product';
import type { SettingsScopeType } from '@cloudbeaver/core-settings';

import { PluginSettings } from './PluginSettings';

@injectable()
export class PluginManagerService {
  store: Map<string, PluginSettings<any>>;
  constructor(private readonly productManagerService: ProductManagerService) {
    this.store = new Map();
  }

  createSettings<T>(scope: string, scopeType: SettingsScopeType, defaults: T) {
    const key = scopeType + '.' + scope;
    const settings = new PluginSettings(this.productManagerService.settings, key, defaults);

    this.store.set(key, settings);
    return settings;
  }

  getSettings(scope: string, scopeType: SettingsScopeType): PluginSettings<any> | undefined {
    return this.store.get(scopeType + '.' + scope);
  }

  /**
   * Please use createSettings instead
   * @deprecated Please use createSettings instead, will be removed in 23.0.0
   */
  getDeprecatedPluginSettings<T>(scope: string, defaults: T) {
    return new PluginSettings(this.productManagerService.settings, scope, defaults);
  }
}
