/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { SettingsProvider, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';

const defaultSettings = schema.object({
  'plugin.data-viewer-request-query-viewer.disabled': schemaExtra.stringedBoolean().default(false),
});

export type DataViewerRequestQueryViewerSettingsSchema = typeof defaultSettings;
export type DataViewerRequestQueryViewerSettings = schema.infer<typeof defaultSettings>;

@injectable(() => [SettingsProviderService])
export class DataViewerRequestQueryViewerSettingsService {
  get disabled(): boolean {
    return this.settings.getValue('plugin.data-viewer-request-query-viewer.disabled');
  }

  readonly settings: SettingsProvider<typeof defaultSettings>;

  constructor(private readonly settingsProviderService: SettingsProviderService) {
    this.settings = this.settingsProviderService.createSettings(defaultSettings);
  }
}
