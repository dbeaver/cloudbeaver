/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { ExtendedDDLResource } from './ExtendedDDLViewer/ExtendedDDLResource.js';
import { DdlViewerBootstrap } from './DdlViewerBootstrap.js';
import { DdlResource } from './DdlViewer/DdlResource.js';
import { DDLViewerFooterService } from './DdlViewer/DDLViewerFooterService.js';

ModuleRegistry.add({
  name: '@cloudbeaver/plugin-ddl-viewer',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, DdlViewerBootstrap)
      .addSingleton(Dependency, proxy(ExtendedDDLResource))
      .addSingleton(Dependency, proxy(DdlResource))
      .addSingleton(DDLViewerFooterService)
      .addSingleton(ExtendedDDLResource)
      .addSingleton(DdlResource);
  },
});
