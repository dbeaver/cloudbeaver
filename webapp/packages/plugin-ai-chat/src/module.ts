/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { AIChatContextService } from './AIChat/AIChatContext/AIChatContextService.js';
import { AIChatConversationMetricsResource } from './AIChat/AIChatConversation/AIChatConversationMetricsResource.js';
import { AIChatConversationsResource } from './AIChat/AIChatConversation/AIChatConversationsResource.js';
import { AIChatConversationsService } from './AIChat/AIChatConversation/AIChatConversationsService.js';
import { AIChatInputService } from './AIChat/AIChatInput/AIChatInputService.js';
import { AIChatMessageActionsService } from './AIChat/AIChatMessage/AIChatMessageActionsService.js';
import { AIChatMessageEventHandler } from './AIChat/AIChatMessage/AIChatMessageEventHandler.js';
import { AIChatMessageService } from './AIChat/AIChatMessage/AIChatMessageService.js';
import { AIChatMessagesResource } from './AIChat/AIChatMessage/AIChatMessagesResource.js';
import { AIChatService } from './AIChat/AIChatService.js';
import { AIChatAttachmentsPasteService } from './AIChatAttachments/AIChatAttachmentsPasteService.js';
import { AIChatAttachmentsService } from './AIChatAttachments/AIChatAttachmentsService.js';
import { AIChatAttachmentsImageHandlerService } from './AIChatAttachmentsHandlers/AIChatAttachmentsImageHandler/AIChatAttachmentsImageHandlerService.js';
import { AIChatFunctionRegistryService } from './AIChatFunctionRegistryService.js';
import { AIChatFunctionsService } from './AIChatFunctionsService.js';
import { AIChatServiceBootstrap } from './AIChatServiceBootstrap.js';
import { AIChatSettingsService } from './AIChatSettingsService.js';
import { AIChatTabService } from './AIChatTabService.js';
import { AIFunctionsResource } from './AIFunctionsResource.js';
import { LocaleService } from './LocaleService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-ai-chat',

  services: () => [
    AIChatContextService,
    AIChatTabService,
    AIChatSettingsService,
    AIChatService,
    AIChatMessageActionsService,
    AIChatMessageEventHandler,
    AIChatMessagesResource,
    AIChatMessageService,
    AIChatConversationsService,
    AIChatConversationsResource,
    AIChatConversationMetricsResource,
    AIChatFunctionsService,
    AIChatFunctionRegistryService,
    AIChatAttachmentsService,
    AIChatAttachmentsPasteService,
    AIChatInputService,
    AIChatAttachmentsImageHandlerService,
    AIFunctionsResource,
  ],
  bootstraps: () => [LocaleService, AIChatServiceBootstrap, AIChatContextService],
});
