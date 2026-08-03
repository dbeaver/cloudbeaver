/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { ExtendedDDLResource } from './ExtendedDDLViewer/ExtendedDDLResource.js';
import { DdlViewerBootstrap } from './DdlViewerBootstrap.js';
import { DDLViewerFooterService } from './DdlViewer/DDLViewerFooterService.js';
import { LocaleService } from './LocaleService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-ddl-viewer',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, DdlViewerBootstrap)
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Dependency, proxy(ExtendedDDLResource))
      .addSingleton(DDLViewerFooterService)
      .addSingleton(ExtendedDDLResource);
  },
});
