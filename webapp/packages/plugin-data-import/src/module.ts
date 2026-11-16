/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { DataImportBootstrap } from './DataImportBootstrap.js';
import { DataImportDriverConfigurationResource } from './DataImportDriverConfigurationResource.js';
import { DataImportProcessorsResource } from './DataImportProcessorsResource.js';
import { DataImportService } from './DataImportService.js';
import { DataImportSettingsService } from './DataImportSettingsService.js';
import { LocaleService } from './LocaleService.js';

// force registration after export plugin
import '@cloudbeaver/plugin-data-export';
export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-data-import',

  services: () => [DataImportService, DataImportProcessorsResource, DataImportDriverConfigurationResource, DataImportSettingsService],
  bootstraps: () => [DataImportBootstrap, LocaleService],
});
