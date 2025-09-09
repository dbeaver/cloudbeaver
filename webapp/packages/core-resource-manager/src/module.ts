/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { ResourceManagerEventHandler } from './ResourceManagerEventHandler.js';
import { ProjectPermissionsResource } from './ProjectPermissionsResource.js';
import { SharedProjectsResource } from './SharedProjectsResource.js';
import { ResourceManagerResource } from './ResourceManagerResource.js';
import { PluginBootstrap } from './PluginBootstrap.js';
import { LocaleService } from './LocaleService.js';

ModuleRegistry.add({
  name: '@cloudbeaver/core-resource-manager',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, proxy(PluginBootstrap))
      .addSingleton(Dependency, proxy(ProjectPermissionsResource))
      .addSingleton(Dependency, proxy(SharedProjectsResource))
      .addSingleton(Dependency, proxy(ResourceManagerResource))
      .addSingleton(ResourceManagerEventHandler)
      .addSingleton(ProjectPermissionsResource)
      .addSingleton(SharedProjectsResource)
      .addSingleton(ResourceManagerResource)
      .addSingleton(PluginBootstrap);
  },
});
