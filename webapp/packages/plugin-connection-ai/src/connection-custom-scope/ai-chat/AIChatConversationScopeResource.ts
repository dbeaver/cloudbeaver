/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { CachedMapResource, isResourceAlias, resourceKeyList, ResourceKeyUtils, type ResourceKey } from '@cloudbeaver/core-resource';
import { GraphQLService, type AiDatabaseScope } from '@cloudbeaver/core-sdk';

import { AIChatConversationsResource } from '@cloudbeaver/plugin-ai-chat';

export interface IAIChatConversationScope {
  id: string;
  scope: AiDatabaseScope | null;
}

export class AIChatConversationScopeResourceImpl extends CachedMapResource<string, IAIChatConversationScope> {
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

export type AIChatConversationScopeResource = AIChatConversationScopeResourceImpl;

export class AIChatConversationScopeResourceDI extends Context.Service<AIChatConversationScopeResourceDI, AIChatConversationScopeResourceImpl>()(
  '@cloudbeaver/plugin-connection-ai/connection-custom-scope/ai-chat/AIChatConversationScopeResource#AIChatConversationScopeResource',
) {
  static readonly implementation = AIChatConversationScopeResourceImpl;

  static readonly dependencies = () => [GraphQLService, AIChatConversationsResource] as const;
  static readonly make: Effect.Effect<
    AIChatConversationScopeResourceImpl,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof AIChatConversationsResource>
  > = Effect.gen(function* makeAIChatConversationScopeResource() {
    const graphQLService = yield* GraphQLService;
    const aiChatConversationsResource = yield* AIChatConversationsResource;

    return new AIChatConversationScopeResourceImpl(graphQLService, aiChatConversationsResource);
  });
  static readonly layer: Layer.Layer<
    AIChatConversationScopeResourceDI,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof AIChatConversationsResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AIChatConversationScopeResource = AIChatConversationScopeResourceDI;
