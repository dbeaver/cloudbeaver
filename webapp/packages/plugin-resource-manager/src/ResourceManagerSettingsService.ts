/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { SettingsProvider, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';

const defaultSettings = schema.object({
  'plugin.resource-manager.disabled': schemaExtra.stringedBoolean().default(false), //! use resourceManagerEnabled in server config instead
});

export type ResourceManagerSettingsSchema = typeof defaultSettings;
export type ResourceManagerSettings = schema.infer<ResourceManagerSettingsSchema>;

@injectable(() => [SettingsProviderService])
export class ResourceManagerSettingsService {
  get disabled(): boolean {
    return this.settings.getValue('plugin.resource-manager.disabled');
  }
  readonly settings: SettingsProvider<ResourceManagerSettingsSchema>;

  constructor(private readonly settingsProviderService: SettingsProviderService) {
    this.settings = this.settingsProviderService.createSettings(defaultSettings);
  }
}
