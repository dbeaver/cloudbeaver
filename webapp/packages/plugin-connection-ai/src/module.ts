/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';

import { ConnectionInfoAiResource } from './ConnectionInfoAiResource.js';
import { ConnectionInfoAiScopeResource } from './ConnectionInfoAiScopeResource.js';
import { ConnectionAiSettingsService } from './connection-ai-settings/ConnectionAiSettingsService.js';
import { ConnectionFormAiService } from './connection-ai-settings/ConnectionFormAiService.js';
import { ConnectionAiScopeService } from './connection-custom-scope/connection-ai-settings/ConnectionAiScopeService.js';
import { AIChatScopeService } from './connection-custom-scope/ai-chat/AIChatScopeService.js';
import { AIChatConversationScopeResource } from './connection-custom-scope/ai-chat/AIChatConversationScopeResource.js';
import { LocaleService } from './LocaleService.js';
import { PluginBootstrap } from './PluginBootstrap.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-connection-ai',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Dependency, proxy(ConnectionInfoAiResource))
      .addSingleton(ConnectionInfoAiResource)
      .addSingleton(ConnectionInfoAiScopeResource)
      .addSingleton(ConnectionFormAiService)
      .addSingleton(AIChatScopeService)
      .addSingleton(AIChatConversationScopeResource)
      .addSingleton(ConnectionAiSettingsService)
      .addSingleton(ConnectionAiScopeService)
      .addSingleton(Bootstrap, PluginBootstrap)
      .addSingleton(Bootstrap, LocaleService);
  },
});
