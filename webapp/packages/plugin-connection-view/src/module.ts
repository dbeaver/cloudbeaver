/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';

import { ConnectionViewPluginBootstrap } from './ConnectionViewPluginBootstrap.js';
import { ConnectionViewResource } from './ConnectionViewResource.js';
import { ConnectionViewService } from './ConnectionViewService.js';
import { LocaleService } from './LocaleService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-connection-view',

  services: () => [ConnectionViewService, ConnectionViewResource],
  bootstraps: () => [ConnectionViewPluginBootstrap, LocaleService],
});
