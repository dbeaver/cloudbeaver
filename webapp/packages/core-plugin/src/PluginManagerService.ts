/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { ProductManagerService } from '@cloudbeaver/core-product';

import { PluginSettings } from './PluginSettings';

@injectable()
export class PluginManagerService {
  constructor(private readonly productManagerService: ProductManagerService) { }

  getCoreSettings<T>(scope: string, defaults: T) {
    return new PluginSettings(this.productManagerService.settings, 'core.' + scope, defaults);
  }

  getPluginSettings<T>(scope: string, defaults: T) {
    return new PluginSettings(this.productManagerService.settings, 'plugin.' + scope, defaults);
  }

  /**
   * Please use getPluginSettings instead
   * @deprecated Please use getPluginSettings instead, will be removed in 23.0.0
   */
  getDeprecatedPluginSettings<T>(scope: string, defaults: T) {
    return new PluginSettings(this.productManagerService.settings, scope, defaults);
  }
}
