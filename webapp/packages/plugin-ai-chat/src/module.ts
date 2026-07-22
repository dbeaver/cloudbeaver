/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { LocaleService } from './LocaleService.js';
import { AIChatTabService } from './AIChatTabService.js';
import { AIChatSettingsService } from './AIChatSettingsService.js';
import { AIChatService } from './AIChat/AIChatService.js';
import { AIChatServiceBootstrap } from './AIChatServiceBootstrap.js';
import { AIChatMessageActionsService } from './AIChat/AIChatMessage/AIChatMessageActionsService.js';
import { AIChatMessageEventHandler } from './AIChat/AIChatMessage/AIChatMessageEventHandler.js';
import { AIChatMessagesResource } from './AIChat/AIChatMessage/AIChatMessagesResource.js';
import { AIChatMessageService } from './AIChat/AIChatMessage/AIChatMessageService.js';
import { AIChatConversationsService } from './AIChat/AIChatConversation/AIChatConversationsService.js';
import { AIChatConversationsResource } from './AIChat/AIChatConversation/AIChatConversationsResource.js';
import { AIChatContextService } from './AIChat/AIChatContext/AIChatContextService.js';
import { AIChatConversationScopeResource } from './AIChat/AIChatConversation/AIChatConversationScopeResource.js';
import { AIChatConversationMetricsResource } from './AIChat/AIChatConversation/AIChatConversationMetricsResource.js';
import { AIChatFunctionsService } from './AIChatFunctionsService.js';
import { AIFunctionsResource } from './AIFunctionsResource.js';
import { AIChatProfilesResource } from './AIChatProfilesResource.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-ai-chat',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, AIChatServiceBootstrap)
      .addSingleton(Bootstrap, proxy(AIChatContextService))
      .addSingleton(Dependency, proxy(AIChatSettingsService))
      .addSingleton(Dependency, proxy(AIChatMessagesResource))
      .addSingleton(Dependency, proxy(AIChatConversationsResource))
      .addSingleton(AIChatContextService)
      .addSingleton(AIChatTabService)
      .addSingleton(AIChatSettingsService)
      .addSingleton(AIChatService)
      .addSingleton(AIChatMessageActionsService)
      .addSingleton(AIChatMessageEventHandler)
      .addSingleton(AIChatMessagesResource)
      .addSingleton(AIChatMessageService)
      .addSingleton(AIChatConversationsService)
      .addSingleton(AIChatConversationsResource)
      .addSingleton(AIChatConversationScopeResource)
      .addSingleton(AIChatConversationMetricsResource)
      .addSingleton(AIChatFunctionsService)
      .addSingleton(AIFunctionsResource)
      .addSingleton(AIChatProfilesResource);
  },
});
