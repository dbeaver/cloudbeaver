/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

import { DataImportBootstrap } from './DataImportBootstrap';
import { DataImportProcessorsResource } from './DataImportProcessorsResource';
import { DataImportService } from './DataImportService';
import { DataImportSettingsService } from './DataImportSettingsService';
import { LocaleService } from './LocaleService';

export const dataImportPluginManifest: PluginManifest = {
  info: {
    name: 'Data Import Plugin',
  },

  providers: [LocaleService, DataImportSettingsService, DataImportBootstrap, DataImportService, DataImportProcessorsResource],
};
