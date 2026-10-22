/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { Executor, ExecutorInterrupter } from '@cloudbeaver/core-executor';
import {
  AIChatConversationMenuService,
  AIChatConversationsResource,
  AIChatMessageService,
  type MessageSendExecutorData,
} from '@cloudbeaver/plugin-ai-chat';
import { AIProfileCredentialsService, AIProfilesResource } from '@cloudbeaver/plugin-ai-profiles';

const AIChatConversationProfile = importLazyComponent(() => import('./AIChatConversationProfile.js').then(m => m.AIChatConversationProfile));

@injectable(() => [AIChatConversationMenuService, AIChatConversationsResource, AIChatMessageService, AIProfilesResource, AIProfileCredentialsService])
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly aiChatConversationMenuService: AIChatConversationMenuService,
    private readonly aiChatConversationsResource: AIChatConversationsResource,
    private readonly aiChatMessageService: AIChatMessageService,
    private readonly aiProfilesResource: AIProfilesResource,
    private readonly aiProfileCredentialsService: AIProfileCredentialsService,
  ) {
    super();
  }

  override register(): void {
    this.aiChatConversationMenuService.sections.add(AIChatConversationProfile);

    const checkCredentials = new Executor<MessageSendExecutorData>();
    checkCredentials.addHandler(async ({ stage, data }, contexts) => {
      if (stage !== 'before') {
        return;
      }

      const conversation = await this.aiChatConversationsResource.load(data.conversationId);
      const profile = conversation.profile ? await this.aiProfilesResource.load(conversation.profile) : undefined;

      if (profile && this.aiProfileCredentialsService.isRequired(profile)) {
        const result = await this.aiProfileCredentialsService.open(profile.id);

        if (result?.status !== DialogueStateResult.Resolved) {
          ExecutorInterrupter.interrupt(contexts);
        }
      }
    });
    this.aiChatMessageService.onMessageSend.before(checkCredentials);
  }
}
