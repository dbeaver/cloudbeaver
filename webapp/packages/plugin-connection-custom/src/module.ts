/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { LocaleService } from './LocaleService.js';
import { CustomConnectionSettingsService } from './CustomConnectionSettingsService.js';
import { CustomConnectionPluginBootstrap } from './CustomConnectionPluginBootstrap.js';

ModuleRegistry.add({
  name: '@cloudbeaver/plugin-connection-custom',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Dependency, proxy(CustomConnectionSettingsService))
      .addSingleton(Bootstrap, proxy(CustomConnectionPluginBootstrap))
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(CustomConnectionPluginBootstrap)
      .addSingleton(CustomConnectionSettingsService);
  },
});
