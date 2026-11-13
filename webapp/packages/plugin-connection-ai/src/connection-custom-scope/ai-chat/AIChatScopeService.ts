/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';
import { AIChatConversationsService, EAIConversationPromptGeneratorId } from '@cloudbeaver/plugin-ai-chat';

export const LazyAIChatConversationScope = importLazyComponent(() => import('./AIChatConversationScope.js').then(m => m.AIChatConversationScope));

export class AIChatScopeServiceImpl {
  constructor(
    private readonly aiChatConversationsService: AIChatConversationsService,
    private readonly connectionInfoResource: ConnectionInfoResource,
  ) {}

  register(): void {
    this.aiChatConversationsService.menuSections.add(
      LazyAIChatConversationScope,
      0,
      ({ conversation }) =>
        conversation.promptGeneratorId === EAIConversationPromptGeneratorId.OBJECT_DESCRIBE ||
        !conversation.dataSourceId ||
        !this.connectionInfoResource.get(conversation.dataSourceId)?.connected,
      ({ conversation }) => [getCachedMapResourceLoaderState(this.connectionInfoResource, () => conversation.dataSourceId ?? null)],
    );
  }
}

export type AIChatScopeService = AIChatScopeServiceImpl;

export class AIChatScopeServiceDI extends Context.Service<AIChatScopeServiceDI, AIChatScopeServiceImpl>()(
  '@cloudbeaver/plugin-connection-ai/connection-custom-scope/ai-chat/AIChatScopeService#AIChatScopeService',
) {
  static readonly implementation = AIChatScopeServiceImpl;

  static readonly dependencies = () => [AIChatConversationsService, ConnectionInfoResource] as const;
  static readonly make: Effect.Effect<
    AIChatScopeServiceImpl,
    never,
    Context.Service.Identifier<typeof AIChatConversationsService> | Context.Service.Identifier<typeof ConnectionInfoResource>
  > = Effect.gen(function* makeAIChatScopeService() {
    const aiChatConversationsService = yield* AIChatConversationsService;
    const connectionInfoResource = yield* ConnectionInfoResource;

    return new AIChatScopeServiceImpl(aiChatConversationsService, connectionInfoResource);
  });
  static readonly layer: Layer.Layer<
    AIChatScopeServiceDI,
    never,
    Context.Service.Identifier<typeof AIChatConversationsService> | Context.Service.Identifier<typeof ConnectionInfoResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AIChatScopeService = AIChatScopeServiceDI;
