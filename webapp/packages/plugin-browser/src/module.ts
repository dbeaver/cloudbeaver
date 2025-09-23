/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, IPreloadService, ModuleRegistry } from '@cloudbeaver/core-di';
import { PluginBrowserPreloadingBootstrap } from './PluginBrowserPreloadingBootstrap.js';
import { LocaleService } from './LocaleService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-browser',

  configure: serviceCollection => {
    serviceCollection.addSingleton(Bootstrap, LocaleService).addSingleton(IPreloadService, PluginBrowserPreloadingBootstrap);
  },
});
