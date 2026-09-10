/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { AIProfileCredentialsService, AIProfilesResource } from '@cloudbeaver/plugin-ai-profiles';

import { AIChatConversationsResource } from './AIChatConversation/AIChatConversationsResource.js';
import { AIChatMessageService } from './AIChatMessage/AIChatMessageService.js';

@injectable(() => [AIChatMessageService, AIChatConversationsResource, AIProfilesResource, AIProfileCredentialsService])
export class AIChatProfileCredentialsBootstrap extends Bootstrap {
  constructor(
    aiChatMessageService: AIChatMessageService,
    aiChatConversationsResource: AIChatConversationsResource,
    aiProfilesResource: AIProfilesResource,
    credentialsService: AIProfileCredentialsService,
  ) {
    super();

    aiChatMessageService.onMessageSend.addHandler(async (event, contexts) => {
      if (event.stage !== 'before') {
        return;
      }

      const conversation = await aiChatConversationsResource.load(event.data.conversationId);
      const profile = conversation.profile ? await aiProfilesResource.load(conversation.profile) : undefined;

      if (profile && credentialsService.isRequired(profile)) {
        const { status } = await credentialsService.open(profile.id);

        if (status !== DialogueStateResult.Resolved) {
          ExecutorInterrupter.interrupt(contexts);
        }
      }
    });
  }
}
