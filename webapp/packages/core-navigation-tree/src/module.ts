/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { ProjectsNavNodeService } from './NodesManager/ProjectsNavNodeService.js';
import { NavTreeResource } from './NodesManager/NavTreeResource.js';
import { NavNodeManagerService } from './NodesManager/NavNodeManagerService.js';
import { NavNodeInfoResource } from './NodesManager/NavNodeInfoResource.js';
import { DBObjectResource } from './NodesManager/DBObjectResource.js';
import { NavTreeSettingsService } from './NavTreeSettingsService.js';
import { LocaleService } from './LocaleService.js';

ModuleRegistry.add({
  name: '@cloudbeaver/core-navigation-tree',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, proxy(NavNodeManagerService))
      .addSingleton(Dependency, proxy(NavTreeSettingsService))
      .addSingleton(Dependency, proxy(NavTreeResource))
      .addSingleton(Dependency, proxy(NavNodeInfoResource))
      .addSingleton(Dependency, proxy(DBObjectResource))
      .addSingleton(ProjectsNavNodeService)
      .addSingleton(NavTreeResource)
      .addSingleton(NavNodeManagerService)
      .addSingleton(NavNodeInfoResource)
      .addSingleton(DBObjectResource)
      .addSingleton(NavTreeSettingsService);
  },
});
