/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { PluginManagerService, PluginSettings } from '@cloudbeaver/core-plugin';
import { schema } from '@cloudbeaver/core-utils';

const defaultSettings = schema.object({
  disabled: schema.coerce.boolean().default(false),
});

export type DataImportSettings = schema.infer<typeof defaultSettings>;

@injectable()
export class DataImportSettingsService extends Dependency {
  readonly settings: PluginSettings<typeof defaultSettings>;

  constructor(private readonly pluginManagerService: PluginManagerService) {
    super();
    this.settings = this.pluginManagerService.createSettings('data-import', 'plugin', defaultSettings);
  }
}
