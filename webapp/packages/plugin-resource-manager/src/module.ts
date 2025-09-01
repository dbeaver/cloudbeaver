/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { PluginBootstrap } from './PluginBootstrap.js';
import { ResourceManagerSettingsService } from './ResourceManagerSettingsService.js';
import { ResourceProjectsResource } from './ResourceProjectsResource.js';
import { ResourceManagerService } from './ResourceManagerService.js';
import { LocaleService } from './LocaleService.js';

ModuleRegistry.add({
  name: '@cloudbeaver/plugin-resource-manager',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Dependency, proxy(ResourceManagerSettingsService))
      .addSingleton(Dependency, proxy(ResourceProjectsResource))
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, PluginBootstrap)
      .addSingleton(ResourceManagerSettingsService)
      .addSingleton(ResourceProjectsResource)
      .addSingleton(ResourceManagerService);
  },
});
