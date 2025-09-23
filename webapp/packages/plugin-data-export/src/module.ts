/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Dependency, ModuleRegistry, proxy, Bootstrap } from '@cloudbeaver/core-di';
import { LocaleService } from './LocaleService.js';
import { DefaultExportOutputSettingsResource } from './Dialog/DefaultExportOutputSettingsResource.js';
import { PluginBootstrap } from './PluginBootstrap.js';
import { DataTransferProcessorsResource } from './DataTransferProcessorsResource.js';
import { DataExportService } from './DataExportService.js';
import { DataExportProcessService } from './DataExportProcessService.js';
import { DataExportMenuService } from './DataExportMenuService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-data-export',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Dependency, proxy(DefaultExportOutputSettingsResource))
      .addSingleton(Dependency, proxy(DataTransferProcessorsResource))
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, PluginBootstrap)
      .addSingleton(DataExportMenuService)
      .addSingleton(DefaultExportOutputSettingsResource)
      .addSingleton(DataTransferProcessorsResource)
      .addSingleton(DataExportService)
      .addSingleton(DataExportProcessService);
  },
});
