/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { PluginBootstrap } from './PluginBootstrap.js';
import { LocaleService } from './LocaleService.js';
import { ConnectionSchemaManagerService } from './ConnectionSchemaManager/ConnectionSchemaManagerService.js';
import { ConnectionSchemaManagerBootstrap } from './ConnectionSchemaManager/ConnectionSchemaManagerBootstrap.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-datasource-context-switch',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, proxy(ConnectionSchemaManagerBootstrap))
      .addSingleton(Bootstrap, PluginBootstrap)
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(ConnectionSchemaManagerBootstrap)
      .addSingleton(ConnectionSchemaManagerService);
  },
});
