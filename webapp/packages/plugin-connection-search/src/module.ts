/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { ConnectionSearchService } from './Search/ConnectionSearchService.js';
import { SearchConnectionPluginBootstrap } from './SearchConnectionPluginBootstrap.js';
import { LocaleService } from './LocaleService.js';
import { ConnectionSearchSettingsService } from './ConnectionSearchSettingsService.js';

ModuleRegistry.add({
  name: '@cloudbeaver/plugin-connection-search',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Dependency, proxy(ConnectionSearchSettingsService))
      .addSingleton(ConnectionSearchSettingsService)
      .addSingleton(ConnectionSearchService)
      .addSingleton(Bootstrap, SearchConnectionPluginBootstrap)
      .addSingleton(Bootstrap, LocaleService);
  },
});
