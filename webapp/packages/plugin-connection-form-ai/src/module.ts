/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { PluginBootstrap } from './PluginBootstrap.js';
import { ConnectionInfoAiResource } from './ConnectionInfoAiResource.js';
import { LocaleService } from './LocaleService.js';
import { ConnectionFormAiService } from './ConnectionFormAiService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-connection-form-ai',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, PluginBootstrap)
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Dependency, proxy(ConnectionInfoAiResource))
      .addSingleton(ConnectionInfoAiResource)
      .addSingleton(ConnectionFormAiService);
  },
});
