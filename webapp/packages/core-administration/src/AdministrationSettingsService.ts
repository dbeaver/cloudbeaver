/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { PluginManagerService, PluginSettings } from '@cloudbeaver/core-plugin';

const defaultSettings = {
  baseFeatures: [] as string[],
};

export type AdministrationSettings = typeof defaultSettings;

@injectable()
export class AdministrationSettingsService {
  readonly settings: PluginSettings<AdministrationSettings>;

  constructor(private readonly pluginManagerService: PluginManagerService) { 
    this.settings = this.pluginManagerService.getPluginSettings('core.administration', defaultSettings);
  }

  isBase(feature: string): boolean {
    return this.getBase().includes(feature);
  }

  getBase(): string[] {
    return this.settings.getValue('baseFeatures');
  }
}
