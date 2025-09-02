/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, ModuleRegistry } from '@cloudbeaver/core-di';
import { TopNavService } from './TopNavBar/TopNavService.js';
import { PluginBootstrap } from './PluginBootstrap.js';

ModuleRegistry.add({
  name: '@cloudbeaver/plugin-top-app-bar',

  configure: serviceCollection => {
    serviceCollection.addSingleton(Bootstrap, PluginBootstrap).addSingleton(TopNavService);
  },
});
