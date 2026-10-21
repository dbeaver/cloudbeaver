/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';

import { ConnectionInfoAiResource } from './ConnectionInfoAiResource.js';
import { ConnectionFormAiBootstrap } from './connection-form/ConnectionFormAiBootstrap.js';
import { ConnectionFormAiService } from './connection-form/ConnectionFormAiService.js';
import { AIChatScopeBootstrap } from './connection-custom-scope/AIChatScopeBootstrap.js';
import { LocaleService } from './LocaleService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-connection-ai',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Dependency, proxy(ConnectionInfoAiResource))
      .addSingleton(ConnectionInfoAiResource)
      .addSingleton(ConnectionFormAiService)
      .addSingleton(Bootstrap, ConnectionFormAiBootstrap)
      .addSingleton(Bootstrap, AIChatScopeBootstrap)
      .addSingleton(Bootstrap, LocaleService);
  },
});
