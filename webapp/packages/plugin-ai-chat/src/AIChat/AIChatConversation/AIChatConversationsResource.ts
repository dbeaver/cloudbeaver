/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { isConnectionInfoParamEqual, type IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import {
  CachedMapResource,
  isResourceAlias,
  resourceKeyList,
  resourceKeyListAliasFactory,
  ResourceKeyUtils,
  type ResourceKey,
} from '@cloudbeaver/core-resource';
import { type AiChatConversationFragment, type AiChatConversationInput, GraphQLService } from '@cloudbeaver/core-sdk';

import type { EAIConversationPromptGeneratorId } from '../../EAIConversationPromptGeneratorId.js';

export type AIChatConversationInfo = Omit<AiChatConversationFragment, 'messages'>;

export type AIChatConversationConfig = AiChatConversationInput;

export const ChatConversationConnectionKey = resourceKeyListAliasFactory(
  '@ai-chat-conversations/connection',
  (connectionKey?: IConnectionInfoParams) => ({
    connectionKey,
  }),
);

@injectable(() => [GraphQLService, UserInfoResource])
export class AIChatConversationsResource extends CachedMapResource<string, AIChatConversationInfo> {
  constructor(
    private readonly graphQLService: GraphQLService,
    userInfoResource: UserInfoResource,
  ) {
    super();

    userInfoResource.onUserChange.addHandler(() => {
      this.clear();
    });

    this.aliases.add(ChatConversationConnectionKey, param =>
      resourceKeyList(
        this.values
          .filter(v => {
            if (!param.options.connectionKey) {
              return !v.dataSourceId;
            }

            return v.dataSourceId && isConnectionInfoParamEqual(v.dataSourceId, param.options.connectionKey);
          })
          .map(c => c.id),
      ),
    );
  }

  async createConversation(
    connectionKey: IConnectionInfoParams | null,
    generatorId?: EAIConversationPromptGeneratorId,
  ): Promise<AIChatConversationInfo> {
    const { conversation } = await this.graphQLService.sdk.createChatConversation({
      config: {
        dataSourceId: connectionKey ?? undefined,
        promptGeneratorId: generatorId,
      },
    });

    this.set(conversation.id, conversation);
    return this.get(conversation.id)!;
  }

  async deleteConversation(conversationId: string): Promise<void> {
    await this.performUpdate(conversationId, undefined, async () => {
      await this.graphQLService.sdk.deleteChatConversation({ conversationId });
      this.delete(conversationId);
    });
  }

  async updateConversation(conversationId: string, config: AIChatConversationConfig): Promise<AIChatConversationInfo> {
    const { conversation } = await this.graphQLService.sdk.updateChatConversation({
      conversationId,
      config,
    });

    this.set(conversation.id, conversation);

    return this.get(conversation.id)!;
  }

  async cancelConversation(conversationId: string): Promise<boolean> {
    const { result } = await this.graphQLService.sdk.cancelConversation({ conversationId });
    return result;
  }

  protected async loader(originalKey: ResourceKey<string>): Promise<Map<string, AIChatConversationInfo>> {
    const conversationList: AIChatConversationInfo[] = [];

    await ResourceKeyUtils.forEachAsync(originalKey, async key => {
      const alias = this.aliases.isAlias(key, ChatConversationConnectionKey);

      if (alias) {
        const { conversations } = await this.graphQLService.sdk.getChatConversations({ dataSourceId: alias.options.connectionKey });
        conversationList.push(...conversations);
      } else if (isResourceAlias(key)) {
        throw new Error('Alias is not supported in this resource');
      } else {
        const { conversation } = await this.graphQLService.sdk.getChatConversation({ conversationId: key });
        conversationList.push(conversation);
      }
    });

    this.set(resourceKeyList(conversationList.map(c => c.id)), conversationList);

    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}

export function compareConversations(a: AIChatConversationInfo, b: AIChatConversationInfo): number {
  return new Date(b.time).getTime() - new Date(a.time).getTime();
}
