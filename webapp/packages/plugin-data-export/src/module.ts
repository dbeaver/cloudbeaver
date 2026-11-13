/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { DataExportMenuService } from './DataExportMenuService.js';
import { DataExportProcessService } from './DataExportProcessService.js';
import { DataExportService } from './DataExportService.js';
import { DataTransferProcessorsResource } from './DataTransferProcessorsResource.js';
import { DefaultExportOutputSettingsResource } from './Dialog/DefaultExportOutputSettingsResource.js';
import { LocaleService } from './LocaleService.js';
import { PluginBootstrap } from './PluginBootstrap.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-data-export',

  services: () => [
    DataExportMenuService,
    DefaultExportOutputSettingsResource,
    DataTransferProcessorsResource,
    DataExportService,
    DataExportProcessService,
  ],
  bootstraps: () => [LocaleService, PluginBootstrap],
});
