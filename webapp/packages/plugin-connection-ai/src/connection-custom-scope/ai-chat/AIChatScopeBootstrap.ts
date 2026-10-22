/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { AIChatConversationsService } from '@cloudbeaver/plugin-ai-chat';

import { AIChatConversationScope } from './AIChatConversationScopeLazy.js';

@injectable(() => [AIChatConversationsService])
export class AIChatScopeBootstrap extends Bootstrap {
  constructor(private readonly aiChatConversationsService: AIChatConversationsService) {
    super();
  }

  override register(): void {
    this.aiChatConversationsService.headerActions.add(AIChatConversationScope);
  }
}
