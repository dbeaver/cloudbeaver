/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { ProjectsService } from './ProjectsService.js';
import { ProjectInfoResource } from './ProjectInfoResource.js';
import { ProjectInfoEventHandler } from './ProjectInfoEventHandler.js';
import { LocaleService } from './LocaleService.js';

ModuleRegistry.add({
  name: '@cloudbeaver/core-projects',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Dependency, proxy(ProjectsService))
      .addSingleton(Dependency, proxy(ProjectInfoResource))
      .addSingleton(ProjectsService)
      .addSingleton(ProjectInfoResource)
      .addSingleton(ProjectInfoEventHandler);
  },
});
