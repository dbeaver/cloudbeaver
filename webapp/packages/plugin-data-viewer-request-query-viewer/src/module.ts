/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, ModuleRegistry, proxy } from '@cloudbeaver/core-di';

import { DataViewerRequestQueryViewerBootstrap } from './DataViewerRequestQueryViewerBootstrap.js';
import { LocaleService } from './LocaleService.js';
import { DataViewerRequestQueryViewerSettingsService } from './DataViewerRequestQueryViewerSettingsService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-data-viewer-request-query-viewer',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, proxy(DataViewerRequestQueryViewerBootstrap))
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(DataViewerRequestQueryViewerBootstrap)
      .addSingleton(DataViewerRequestQueryViewerSettingsService);
  },
});
