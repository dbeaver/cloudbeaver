/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Dependency, ModuleRegistry, proxy, Bootstrap } from '@cloudbeaver/core-di';
import { LocaleService } from './LocaleService.js';
import { DataImportService } from './DataImportService.js';
import { DataImportProcessorsResource } from './DataImportProcessorsResource.js';
import { DataImportSettingsService } from './DataImportSettingsService.js';
import { DataImportBootstrap } from './DataImportBootstrap.js';

ModuleRegistry.add({
  name: '@cloudbeaver/plugin-data-import',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Dependency, proxy(DataImportProcessorsResource))
      .addSingleton(Bootstrap, DataImportBootstrap)
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(DataImportService)
      .addSingleton(DataImportProcessorsResource)
      .addSingleton(DataImportSettingsService);
  },
});
