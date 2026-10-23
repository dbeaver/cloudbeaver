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
import { Executor, ExecutorInterrupter, type IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { AIChatConversationsService, AIChatMessageService, type MessageSendExecutorData } from '@cloudbeaver/plugin-ai-chat';
import { AIProfileCredentialsService } from '@cloudbeaver/plugin-ai-profiles';

import { AIChatConversationProfileService } from './AIChatConversationProfileService.js';

const AIChatConversationProfile = importLazyComponent(() => import('./AIChatConversationProfile.js').then(m => m.AIChatConversationProfile));

@injectable(() => [AIChatConversationsService, AIChatConversationProfileService, AIChatMessageService, AIProfileCredentialsService])
export class PluginBootstrap extends Bootstrap {
  private readonly checkCredentials = new Executor<MessageSendExecutorData>();

  constructor(
    private readonly aiChatConversationsService: AIChatConversationsService,
    private readonly aiChatConversationProfileService: AIChatConversationProfileService,
    private readonly aiChatMessageService: AIChatMessageService,
    private readonly aiProfileCredentialsService: AIProfileCredentialsService,
  ) {
    super();
  }

  override register(): void {
    this.aiChatConversationsService.menuSections.add(AIChatConversationProfile);

    this.checkCredentials.addHandler(this.restoreProfileAndCheckCredentials.bind(this));
    this.aiChatMessageService.onMessageSend.before(this.checkCredentials);
  }

  private async restoreProfileAndCheckCredentials(
    { stage, data }: MessageSendExecutorData,
    contexts: IExecutionContextProvider<MessageSendExecutorData>,
  ): Promise<void> {
    if (stage !== 'before') {
      return;
    }

    const profile = await this.aiChatConversationProfileService.restoreConversationProfile(data.conversationId);

    if (profile && this.aiProfileCredentialsService.isRequired(profile)) {
      const result = await this.aiProfileCredentialsService.open(profile.id);

      if (result?.status !== DialogueStateResult.Resolved) {
        ExecutorInterrupter.interrupt(contexts);
      }
    }
  }
}
