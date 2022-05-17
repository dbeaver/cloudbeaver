/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

import { LocaleService } from './LocaleService';
import { NavResourceNodeService } from './NavResourceNodeService';
import { PluginBootstrap } from './PluginBootstrap';
import { ProjectsResource } from './ProjectsResource';
import { ResourceManagerResource } from './ResourceManagerResource';
import { ResourceManagerService } from './ResourceManagerService';
import { ResourceManagerSettingsService } from './ResourceManagerSettingsService';

export const resourceManagerPlugin: PluginManifest = {
  info: { name: 'Resource manager plugin' },
  providers: [
    ResourceManagerSettingsService,
    PluginBootstrap,
    LocaleService,
    ResourceManagerService,
    ProjectsResource,
    ResourceManagerResource,
    NavResourceNodeService,
  ],
};