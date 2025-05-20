/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { SettingsProvider, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';

const defaultSettings = schema.object({
  'plugin.datasource-transaction-manager.disabled': schemaExtra.stringedBoolean().default(false),
  'plugin.datasource-transaction-manager.allowCommitModeSwitch': schemaExtra.stringedBoolean().default(true),
});

@injectable()
export class TransactionManagerSettingsService extends Dependency {
  get disabled(): boolean {
    return this.settings.getValue('plugin.datasource-transaction-manager.disabled');
  }

  get allowCommitModeSwitch(): boolean {
    return this.settings.getValue('plugin.datasource-transaction-manager.allowCommitModeSwitch');
  }

  readonly settings: SettingsProvider<typeof defaultSettings>;

  constructor(private readonly settingsProviderService: SettingsProviderService) {
    super();
    this.settings = this.settingsProviderService.createSettings(defaultSettings);
  }
}
