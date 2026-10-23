/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';
import { AIChatConversationsService, EAIConversationPromptGeneratorId } from '@cloudbeaver/plugin-ai-chat';
import { importLazyComponent } from '@cloudbeaver/core-blocks';

export const LazyAIChatConversationScope = importLazyComponent(() => import('./AIChatConversationScope.js').then(m => m.AIChatConversationScope));

@injectable(() => [AIChatConversationsService, ConnectionInfoResource])
export class AIChatScopeService {
  constructor(
    private readonly aiChatConversationsService: AIChatConversationsService,
    private readonly connectionInfoResource: ConnectionInfoResource,
  ) {}

  register(): void {
    this.aiChatConversationsService.actions.add(
      LazyAIChatConversationScope,
      undefined,
      ({ conversation }) =>
        conversation.promptGeneratorId === EAIConversationPromptGeneratorId.OBJECT_DESCRIBE ||
        !conversation.dataSourceId ||
        !this.connectionInfoResource.get(conversation.dataSourceId)?.connected,
      ({ conversation }) => [getCachedMapResourceLoaderState(this.connectionInfoResource, () => conversation.dataSourceId ?? null)],
    );
  }
}
