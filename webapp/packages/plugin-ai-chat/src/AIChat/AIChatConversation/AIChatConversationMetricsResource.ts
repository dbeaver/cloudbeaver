/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { CachedMapResource, isResourceAlias, resourceKeyList, ResourceKeyUtils, type ResourceKey } from '@cloudbeaver/core-resource';
import { GraphQLService, type AiChatConversationMetricsFragment } from '@cloudbeaver/core-sdk';

import { AIChatMessagesResource } from '../AIChatMessage/AIChatMessagesResource.js';
import { AIChatConversationsResource } from './AIChatConversationsResource.js';

type AIChatConversationMetrics = AiChatConversationMetricsFragment;

export class AIChatConversationMetricsResourceImpl extends CachedMapResource<string, AIChatConversationMetrics> {
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

export type AIChatConversationMetricsResource = AIChatConversationMetricsResourceImpl;

export class AIChatConversationMetricsResourceDI extends Context.Service<
  AIChatConversationMetricsResourceDI,
  AIChatConversationMetricsResourceImpl
>()('@cloudbeaver/plugin-ai-chat/AIChat/AIChatConversation/AIChatConversationMetricsResource#AIChatConversationMetricsResource') {
  static readonly implementation = AIChatConversationMetricsResourceImpl;

  static readonly dependencies = () => [GraphQLService, AIChatMessagesResource, AIChatConversationsResource] as const;
  static readonly make: Effect.Effect<
    AIChatConversationMetricsResourceImpl,
    never,
    | Context.Service.Identifier<typeof GraphQLService>
    | Context.Service.Identifier<typeof AIChatMessagesResource>
    | Context.Service.Identifier<typeof AIChatConversationsResource>
  > = Effect.gen(function* makeAIChatConversationMetricsResource() {
    const graphQLService = yield* GraphQLService;
    const aiChatMessagesResource = yield* AIChatMessagesResource;
    const aiChatConversationsResource = yield* AIChatConversationsResource;

    return new AIChatConversationMetricsResourceImpl(graphQLService, aiChatMessagesResource, aiChatConversationsResource);
  });
  static readonly layer: Layer.Layer<
    AIChatConversationMetricsResourceDI,
    never,
    | Context.Service.Identifier<typeof GraphQLService>
    | Context.Service.Identifier<typeof AIChatMessagesResource>
    | Context.Service.Identifier<typeof AIChatConversationsResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AIChatConversationMetricsResource = AIChatConversationMetricsResourceDI;
