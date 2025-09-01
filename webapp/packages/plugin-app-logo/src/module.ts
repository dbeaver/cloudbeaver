/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry, Bootstrap } from '@cloudbeaver/core-di';
import { AppLogoPluginBootstrap } from './PluginBootstrap.js';

ModuleRegistry.add({
  name: '@cloudbeaver/plugin-app-logo',

  configure: serviceCollection => {
    serviceCollection.addSingleton(Bootstrap, AppLogoPluginBootstrap);
  },
});
