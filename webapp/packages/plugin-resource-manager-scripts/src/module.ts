/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { ResourceManagerScriptsSettingsService } from './ResourceManagerScriptsSettingsService.js';
import { PluginBootstrap } from './PluginBootstrap.js';
import { LocaleService } from './LocaleService.js';
import { ResourceManagerScriptsService } from './ResourceManagerScriptsService.js';

ModuleRegistry.add({
  name: '@cloudbeaver/plugin-resource-manager-scripts',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Dependency, proxy(ResourceManagerScriptsSettingsService))
      .addSingleton(Bootstrap, PluginBootstrap)
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(ResourceManagerScriptsService)
      .addSingleton(ResourceManagerScriptsSettingsService);
  },
});
