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
  'plugin.transaction-manager.disabled': schemaExtra.stringedBoolean().default(false),
});

export type TransactionManagerSettingsSchema = typeof defaultSettings;
export type TransactionManagerSettings = schema.infer<typeof defaultSettings>;

@injectable()
export class TransactionManagerSettingsService extends Dependency {
  get disabled(): boolean {
    return this.settings.getValue('plugin.transaction-manager.disabled');
  }
  readonly settings: SettingsProvider<typeof defaultSettings>;

  constructor(private readonly settingsProviderService: SettingsProviderService) {
    super();
    this.settings = this.settingsProviderService.createSettings(defaultSettings);
  }
}
