/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { ProductManagerService } from '@cloudbeaver/core-product';

import { PluginSettings } from './PluginSettings';

@injectable()
export class PluginManagerService {
  store: Map<string, PluginSettings<any>>;
  constructor(private readonly productManagerService: ProductManagerService) {
    this.store = new Map();
  }

  getCoreSettings<T>(scope: string, defaults?: T): PluginSettings<any> {
    const coreSettings = this.store.get('core.' + scope);
    if (coreSettings !== undefined) {
      return coreSettings;
    } else {
      const coreSettings = new PluginSettings(this.productManagerService.settings, 'core.' + scope, defaults);
      this.store.set('core.' + scope, coreSettings);

      return coreSettings;
    }
  }

  getPluginSettings<T>(scope: string, defaults?: T): PluginSettings<any> {
    const pluginSettings = this.store.get('plugin.' + scope);
    if (pluginSettings !== undefined) {
      return pluginSettings;
    } else {
      const pluginSettings = new PluginSettings(this.productManagerService.settings, 'plugin.' + scope, defaults);
      this.store.set('plugin.' + scope, pluginSettings);

      return pluginSettings;
    }
  }

  /**
   * Please use getPluginSettings instead
   * @deprecated Please use getPluginSettings instead, will be removed in 23.0.0
   */
  getDeprecatedPluginSettings<T>(scope: string, defaults: T) {
    return new PluginSettings(this.productManagerService.settings, scope, defaults);
  }
}
