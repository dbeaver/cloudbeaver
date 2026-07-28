/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { CachedMapResource, isResourceAlias, resourceKeyList, ResourceKeyUtils, type ResourceKey } from '@cloudbeaver/core-resource';
import { type AiDatabaseScope, GraphQLService } from '@cloudbeaver/core-sdk';

import { AIChatConversationsResource } from './AIChatConversationsResource.js';

export interface IAIChatConversationScope {
  id: string;
  scope: AiDatabaseScope | null;
}

@injectable(() => [GraphQLService, AIChatConversationsResource])
export class AIChatConversationScopeResource extends CachedMapResource<string, IAIChatConversationScope> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly aiChatConversationsResource: AIChatConversationsResource,
  ) {
    super();

    this.sync(this.aiChatConversationsResource);
    this.aiChatConversationsResource.onItemDelete.addHandler(this.delete.bind(this));
  }

  async updateScope(conversationId: string, scope: AiDatabaseScope): Promise<IAIChatConversationScope> {
    const { conversation } = await this.graphQLService.sdk.updateChatConversation({
      conversationId,
      config: {
        settings: {
          scope,
        },
      },
    });

    this.set(conversation.id, { id: conversation.id, scope: conversation.settings?.scope ?? null });
    return this.get(conversation.id)!;
  }

  protected async loader(originalKey: ResourceKey<string>): Promise<Map<string, IAIChatConversationScope>> {
    if (isResourceAlias(originalKey)) {
      throw new Error('Alias is not supported in this resource');
    }

    const scopeList: IAIChatConversationScope[] = [];

    await ResourceKeyUtils.forEachAsync(originalKey, async key => {
      const { result } = await this.graphQLService.sdk.getChatConversationScope({ conversationId: key });
      scopeList.push({ id: result.id, scope: result.settings?.scope ?? null });
    });

    this.set(resourceKeyList(scopeList.map(c => c.id)), scopeList);

    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}
