/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { LocaleService } from './LocaleService.js';
import { ResourceFoldersBootstrap } from './NavNodes/ResourceFoldersBootstrap.js';
import { NavResourceNodeService } from './NavResourceNodeService.js';
import { NavTreeRMContextMenuBootstrap } from './NavTreeRMContextMenuBootstrap.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-navigation-tree-rm',

  services: () => [NavResourceNodeService],
  bootstraps: () => [LocaleService, ResourceFoldersBootstrap, NavTreeRMContextMenuBootstrap],
});
