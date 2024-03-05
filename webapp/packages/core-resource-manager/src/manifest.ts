/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

import { LocaleService } from './LocaleService';
import { PluginBootstrap } from './PluginBootstrap';
import { ProjectPermissionsResource } from './ProjectPermissionsResource';
import { ResourceManagerEventHandler } from './ResourceManagerEventHandler';
import { ResourceManagerResource } from './ResourceManagerResource';
import { SharedProjectsResource } from './SharedProjectsResource';

export const resourceManagerManifest: PluginManifest = {
  info: {
    name: 'Resource Manager Core',
  },

  providers: [
    PluginBootstrap,
    SharedProjectsResource,
    ProjectPermissionsResource,
    ResourceManagerEventHandler,
    ResourceManagerResource,
    LocaleService,
  ],
};
