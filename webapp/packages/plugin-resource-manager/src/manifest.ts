/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

import { LocaleService } from './LocaleService';
import { PluginBootstrap } from './PluginBootstrap';
import { ProjectsResource } from './ProjectsResource';
import { ResourceManagerMenuService } from './ResourceManagerMenuService';
import { ResourceManagerService } from './ResourceManagerService';
import { ScriptManagerSyncService } from './ScriptsManager/ScriptManagerSyncService';
import { ScriptsManagerService } from './ScriptsManager/ScriptsManagerService';

export const resourceManagerPlugin: PluginManifest = {
  info: { name: 'Resource manager plugin' },
  providers: [
    PluginBootstrap,
    LocaleService,
    ResourceManagerService,
    ScriptsManagerService,
    ResourceManagerMenuService,
    ProjectsResource,
    ScriptManagerSyncService,
  ],
};