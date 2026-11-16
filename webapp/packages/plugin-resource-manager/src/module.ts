/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { LocaleService } from './LocaleService.js';
import { PluginBootstrap } from './PluginBootstrap.js';
import { ResourceManagerService } from './ResourceManagerService.js';
import { ResourceManagerSettingsService } from './ResourceManagerSettingsService.js';
import { ResourceProjectsResource } from './ResourceProjectsResource.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-resource-manager',

  services: () => [ResourceManagerSettingsService, ResourceProjectsResource, ResourceManagerService],
  bootstraps: () => [LocaleService, PluginBootstrap],
});
