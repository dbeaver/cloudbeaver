/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

import { NavTreeSettingsService } from './NavTreeSettingsService';
import { DBObjectResource } from './NodesManager/DBObjectResource';
import { NavNodeInfoResource } from './NodesManager/NavNodeInfoResource';
import { NavNodeManagerService } from './NodesManager/NavNodeManagerService';
import { NavTreeResource } from './NodesManager/NavTreeResource';
import { ProjectsNavNodeService } from './NodesManager/ProjectsNavNodeService';

export const coreNavigationTree: PluginManifest = {
  info: {
    name: 'Core Navigation Tree',
  },

  providers: [
    NavTreeSettingsService,
    NavNodeManagerService,
    DBObjectResource,
    NavNodeInfoResource,
    NavTreeResource,
    ProjectsNavNodeService,
  ],
};
