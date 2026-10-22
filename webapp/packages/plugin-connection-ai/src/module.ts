/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';

import { ConnectionInfoAiResource } from './ConnectionInfoAiResource.js';
import { ConnectionFormAiBootstrap } from './connection-ai-settings/ConnectionFormAiBootstrap.js';
import { ConnectionFormAiService } from './connection-ai-settings/ConnectionFormAiService.js';
import { AIChatScopeBootstrap } from './connection-custom-scope/ai-chat/AIChatScopeBootstrap.js';
import { ConnectionAiScopeBootstrap } from './connection-custom-scope/connection-ai-settings/ConnectionAiScopeBootstrap.js';
import { AIChatScopeService } from './connection-custom-scope/ai-chat/AIChatScopeService.js';
import { AIChatConversationScopeResource } from './connection-custom-scope/ai-chat/AIChatConversationScopeResource.js';
import { LocaleService } from './LocaleService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-connection-ai',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Dependency, proxy(ConnectionInfoAiResource))
      .addSingleton(ConnectionInfoAiResource)
      .addSingleton(ConnectionFormAiService)
      .addSingleton(AIChatScopeService)
      .addSingleton(AIChatConversationScopeResource)
      .addSingleton(Bootstrap, ConnectionFormAiBootstrap)
      .addSingleton(Bootstrap, AIChatScopeBootstrap)
      .addSingleton(Bootstrap, ConnectionAiScopeBootstrap)
      .addSingleton(Bootstrap, LocaleService);
  },
});
