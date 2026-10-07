/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { isDefined } from '@dbeaver/js-helpers';
import { type IConnectionInfoParams } from '@cloudbeaver/core-connections';
import type { AiDatabaseScope } from '@cloudbeaver/core-sdk';
import { Executor, ExecutorInterrupter } from '@cloudbeaver/core-executor';

import {
  AIChatConversationsResource,
  ChatConversationConnectionKey,
  compareConversations,
  type AIChatConversationConfig,
  type AIChatConversationInfo,
} from './AIChatConversationsResource.js';
import { AIChatContextService } from '../AIChatContext/AIChatContextService.js';
import { EAIConversationPromptGeneratorId } from '../../EAIConversationPromptGeneratorId.js';
import { AIChatConversationScopeResource, type IAIChatConversationScope } from './AIChatConversationScopeResource.js';
import { AIChatMessagesResource } from '../AIChatMessage/AIChatMessagesResource.js';

type NewConversationExecutorData =
  | { stage: 'before'; data: IConnectionInfoParams | null }
  | { stage: 'after'; data: AIChatConversationInfo };

@injectable(() => [AIChatContextService, AIChatConversationsResource, AIChatConversationScopeResource, AIChatMessagesResource])
export class AIChatConversationsService {
  readonly onNewConversation: Executor<NewConversationExecutorData>;

  get defaultConversation(): AIChatConversationInfo | null {
    const context = this.aiChatContextService.currentContext;
    const conversations = this.aiChatConversationsResource.get(ChatConversationConnectionKey(context?.connectionKey));
    const sorted = conversations.filter(isDefined).sort(compareConversations);

    return sorted[0] ?? null;
  }

  get currentConversationId(): string | null {
    return this.conversationId ?? this.defaultConversation?.id ?? null;
  }

  get processing(): boolean {
    const conversationId = this.currentConversationId;

    if (conversationId) {
      const conversation = this.aiChatConversationsResource.get(conversationId);
      return conversation?.waitingForResponse ?? false;
    }

    return false;
  }

  private conversationId: string | null;

  constructor(
    private readonly aiChatContextService: AIChatContextService,
    private readonly aiChatConversationsResource: AIChatConversationsResource,
    private readonly aiChatConversationScopeResource: AIChatConversationScopeResource,
    private readonly aiChatMessagesResource: AIChatMessagesResource,
  ) {
    this.onNewConversation = new Executor();
    this.conversationId = null;

    this.aiChatContextService.onContextChange.addHandler(() => {
      this.selectConversation(null);
    });

    this.aiChatConversationsResource.onItemDelete.addHandler(conversationId => {
      if (this.conversationId === conversationId) {
        this.selectConversation(null);
      }
    });

    makeObservable<this, 'conversationId'>(this, {
      conversationId: observable.ref,
      currentConversationId: computed,
      defaultConversation: computed,
      processing: computed,
    });
  }

  selectConversation(conversationId: string | null): void {
    if (this.conversationId !== conversationId) {
      this.conversationId = conversationId;
    }
  }

  async deleteConversation(conversationId: string): Promise<void> {
    await this.aiChatConversationsResource.deleteConversation(conversationId);
  }

  async updateConversation(conversationId: string, config: AIChatConversationConfig): Promise<AIChatConversationInfo> {
    const conversation = await this.aiChatConversationsResource.updateConversation(conversationId, config);
    return conversation;
  }

  async updateConversationScope(conversationId: string, scope: AiDatabaseScope): Promise<IAIChatConversationScope> {
    const result = await this.aiChatConversationScopeResource.updateScope(conversationId, scope);
    return result;
  }

  async updateConversationProfile(conversationId: string, profileId: string): Promise<AIChatConversationInfo> {
    const conversation = await this.aiChatConversationsResource.updateConversation(conversationId, { settings: { profile: profileId } });
    return conversation;
  }

  async createConversation(key: IConnectionInfoParams | null, generatorId?: EAIConversationPromptGeneratorId): Promise<AIChatConversationInfo> {
    const conversation = await this.aiChatConversationsResource.createConversation(key, generatorId);
    this.selectConversation(conversation.id);
    return conversation;
  }

  async newConversation(key: IConnectionInfoParams | null): Promise<AIChatConversationInfo | null> {
    const contexts = await this.onNewConversation.execute({ stage: 'before', data: key });

    if (ExecutorInterrupter.isInterrupted(contexts)) {
      return null;
    }

    const emptyConversation = await this.getEmptyConversation(this.currentConversationId);
    const conversation = emptyConversation ?? (await this.createConversation(key));

    await this.onNewConversation.execute({ stage: 'after', data: conversation });

    return conversation;
  }

  private async getEmptyConversation(conversationId: string | null): Promise<AIChatConversationInfo | null> {
    if (!conversationId) {
      return null;
    }

    const messages = await this.aiChatMessagesResource.load(conversationId);

    if (messages.length > 0) {
      return null;
    }

    return await this.aiChatConversationsResource.load(conversationId);
  }
}
