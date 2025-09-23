/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, ModuleRegistry } from '@cloudbeaver/core-di';
import { ResourceFoldersBootstrap } from './NavNodes/ResourceFoldersBootstrap.js';
import { NavTreeRMContextMenuBootstrap } from './NavTreeRMContextMenuBootstrap.js';
import { NavResourceNodeService } from './NavResourceNodeService.js';
import { LocaleService } from './LocaleService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-navigation-tree-rm',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, ResourceFoldersBootstrap)
      .addSingleton(Bootstrap, NavTreeRMContextMenuBootstrap)
      .addSingleton(NavResourceNodeService);
  },
});
