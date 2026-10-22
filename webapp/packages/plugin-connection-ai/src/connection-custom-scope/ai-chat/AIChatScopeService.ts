/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { AIChatConversationsService } from '@cloudbeaver/plugin-ai-chat';

import { AIChatConversationScope } from './AIChatConversationScopeLazy.js';

@injectable(() => [AIChatConversationsService])
export class AIChatScopeService {
  constructor(private readonly aiChatConversationsService: AIChatConversationsService) {}

  register(): void {
    this.aiChatConversationsService.headerActions.add(AIChatConversationScope);
  }
}
