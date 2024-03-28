/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { SettingsManagerService, SettingsProvider, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schema } from '@cloudbeaver/core-utils';

const defaultSettings = schema.object({
  'plugin.sql-editor-navigation-tab-resource': schema.object({}),
});

export type ResourceEditorSettings = typeof defaultSettings;

@injectable()
export class ResourceEditorSettingsService extends Dependency {
  readonly settings: SettingsProvider<ResourceEditorSettings>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
  ) {
    super();
    this.settings = this.settingsProviderService.createSettings(defaultSettings);

    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings(this.settings, () => []);
  }
}
