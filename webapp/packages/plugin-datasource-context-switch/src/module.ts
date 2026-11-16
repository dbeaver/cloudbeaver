/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { ConnectionSchemaManagerBootstrap } from './ConnectionSchemaManager/ConnectionSchemaManagerBootstrap.js';
import { ConnectionSchemaManagerService } from './ConnectionSchemaManager/ConnectionSchemaManagerService.js';
import { LocaleService } from './LocaleService.js';
import { PluginBootstrap } from './PluginBootstrap.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-datasource-context-switch',

  services: () => [ConnectionSchemaManagerBootstrap, ConnectionSchemaManagerService],
  bootstraps: () => [ConnectionSchemaManagerBootstrap, PluginBootstrap, LocaleService],
});
