/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, ModuleRegistry } from '@cloudbeaver/core-di';
import { PluginGridSearchBootstrap } from './PluginGridSearchBootstrap.js';
import { GridSearchService } from './GridSearch/GridSearchService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-grid-search',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, PluginGridSearchBootstrap).addSingleton(GridSearchService);
  },
});