/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, ModuleRegistry } from '@cloudbeaver/core-di';
import { LocaleService } from './LocaleService.js';
import { NavigationTreeFiltersBootstrap } from './NavigationTreeFiltersBootstrap.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-navigation-tree-filters',

  configure: serviceCollection => {
    serviceCollection.addSingleton(Bootstrap, NavigationTreeFiltersBootstrap).addSingleton(Bootstrap, LocaleService);
  },
});
