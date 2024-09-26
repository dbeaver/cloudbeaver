/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import {
  createSettingsAliasResolver,
  ROOT_SETTINGS_LAYER,
  SettingsProvider,
  SettingsProviderService,
  SettingsResolverService,
} from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';

const defaultSettings = schema.object({
  'plugin.resource-manager.disabled': schemaExtra.stringedBoolean().default(false), //! use resourceManagerEnabled in server config instead
});

export type ResourceManagerSettings = schema.infer<typeof defaultSettings>;

@injectable()
export class ResourceManagerSettingsService extends Dependency {
  get disabled(): boolean {
    return this.settings.getValue('plugin.resource-manager.disabled');
  }
  readonly settings: SettingsProvider<typeof defaultSettings>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsResolverService: SettingsResolverService,
  ) {
    super();
    this.settings = this.settingsProviderService.createSettings(defaultSettings);
    this.settingsResolverService.addResolver(
      ROOT_SETTINGS_LAYER,
      /** @deprecated Use settings instead, will be removed in 23.0.0 */
      createSettingsAliasResolver(this.settingsResolverService, this.settings, {
        'plugin.resource-manager.disabled': 'plugin_resource_manager.disabled',
      }),
    );
  }
}
