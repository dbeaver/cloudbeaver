/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionsManagerService } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NodeManagerUtils } from '@cloudbeaver/core-navigation-tree';
import { AiDatabaseScope } from '@cloudbeaver/core-sdk';
import { AIChatConversationsService, type AIChatConversationInfo } from '@cloudbeaver/plugin-ai-chat';

import { ConnectionInfoAiResource } from '../../ConnectionInfoAiResource.js';
import { AiScopeDialog } from '../AiScopeDialogLazy.js';
import { AIChatConversationScopeResource } from './AIChatConversationScopeResource.js';

@injectable(() => [
  AIChatConversationsService,
  ConnectionsManagerService,
  ConnectionInfoAiResource,
  CommonDialogService,
  AIChatConversationScopeResource,
])
export class AIChatScopeService {
  constructor(
    private readonly aiChatConversationsService: AIChatConversationsService,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly connectionInfoAiResource: ConnectionInfoAiResource,
    private readonly commonDialogService: CommonDialogService,
    private readonly aiChatConversationScopeResource: AIChatConversationScopeResource,
  ) {}

  async selectScope(conversation: AIChatConversationInfo, scope: AiDatabaseScope): Promise<void> {
    if (scope === AiDatabaseScope.Custom) {
      const key = conversation.dataSourceId;
      const connection = key ? await this.connectionsManagerService.requireConnection(key) : null;

      if (!key || !connection) {
        return;
      }

      const settings = await this.connectionInfoAiResource.refresh(key);
      const { status, result } = await this.commonDialogService.open(AiScopeDialog, {
        rootId: connection.nodePath ?? NodeManagerUtils.connectionIdToConnectionNodeId(key.projectId, key.connectionId),
        selectedIds: conversation.settings?.customObjectIds ?? [],
        title: 'plugin_ai_chat_scope_custom_dialog_title',
        allowedIds: settings.scope === AiDatabaseScope.Custom ? (settings.customObjectIds ?? []) : null,
      });

      if (status !== DialogueStateResult.Resolved) {
        return;
      }

      await this.aiChatConversationsService.updateConversation(conversation.id, {
        settings: { customObjectIds: result },
      });
    }

    await this.aiChatConversationScopeResource.updateScope(conversation.id, scope);
  }
}
