/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { CachedMapResource, isResourceAlias, resourceKeyList, ResourceKeyUtils, type ResourceKey } from '@cloudbeaver/core-resource';
import { type AiChatConversationMetricsFragment, GraphQLService } from '@cloudbeaver/core-sdk';

import { AIChatMessagesResource } from '../AIChatMessage/AIChatMessagesResource.js';
import { AIChatConversationsResource } from './AIChatConversationsResource.js';

type AIChatConversationMetrics = AiChatConversationMetricsFragment;

@injectable(() => [GraphQLService, AIChatMessagesResource, AIChatConversationsResource])
export class AIChatConversationMetricsResource extends CachedMapResource<string, AIChatConversationMetrics> {
  constructor(
    private readonly graphQLService: GraphQLService,
    aiChatMessagesResource: AIChatMessagesResource,
    aiChatConversationsResource: AIChatConversationsResource,
  ) {
    super();

    this.sync(aiChatConversationsResource);

    aiChatMessagesResource.onMessageStream.addHandler(({ param: { conversationId }, state }) => {
      if (state === 'end') {
        this.markOutdated(conversationId);
      }
    });
  }

  protected async loader(originalKey: ResourceKey<string>): Promise<Map<string, AIChatConversationMetrics>> {
    if (isResourceAlias(originalKey)) {
      throw new Error('Aliases are not supported in this resource');
    }

    const conversationMetrics: AIChatConversationMetrics[] = [];

    await ResourceKeyUtils.forEachAsync(originalKey, async conversationId => {
      const { result } = await this.graphQLService.sdk.getChatConversationMetrics({ conversationId });

      if (result.metrics) {
        conversationMetrics.push(result);
      }
    });

    this.set(resourceKeyList(conversationMetrics.map(c => c.id)), conversationMetrics);

    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}
