/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';

import { AIChatConversationProfileService } from './AIChatConversationProfileService.js';
import { PluginBootstrap } from './PluginBootstrap.js';
import { LocaleService } from './LocaleService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-ai-chat-profiles',
  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Dependency, proxy(AIChatConversationProfileService))
      .addSingleton(AIChatConversationProfileService)
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, PluginBootstrap);
  },
});
