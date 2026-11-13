/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { LocaleService } from './LocaleService.js';
import { NavTreeSettingsService } from './NavTreeSettingsService.js';
import { DBObjectResource } from './NodesManager/DBObjectResource.js';
import { NavNodeInfoResource } from './NodesManager/NavNodeInfoResource.js';
import { NavNodeManagerService } from './NodesManager/NavNodeManagerService.js';
import { NavTreeResource } from './NodesManager/NavTreeResource.js';
import { ProjectsNavNodeService } from './NodesManager/ProjectsNavNodeService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/core-navigation-tree',

  services: () => [ProjectsNavNodeService, NavTreeResource, NavNodeManagerService, NavNodeInfoResource, DBObjectResource, NavTreeSettingsService],
  bootstraps: () => [LocaleService, NavNodeManagerService],
});
