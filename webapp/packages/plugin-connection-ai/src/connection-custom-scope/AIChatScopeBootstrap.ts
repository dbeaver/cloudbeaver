/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionsManagerService } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { NodeManagerUtils } from '@cloudbeaver/core-navigation-tree';
import { AiDatabaseScope } from '@cloudbeaver/core-sdk';
import { AIChatConversationsService } from '@cloudbeaver/plugin-ai-chat';

import { ConnectionInfoAiResource } from '../ConnectionInfoAiResource.js';
import { AiScopeDialog } from './AiScopeDialogLazy.js';

@injectable(() => [AIChatConversationsService, ConnectionsManagerService, ConnectionInfoAiResource, CommonDialogService])
export class AIChatScopeBootstrap extends Bootstrap {
  constructor(
    private readonly aiChatConversationsService: AIChatConversationsService,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly connectionInfoAiResource: ConnectionInfoAiResource,
    private readonly commonDialogService: CommonDialogService,
  ) {
    super();
  }

  override register(): void {
    this.aiChatConversationsService.onScopeSelect.addHandler(async ({ conversation, scope }, contexts) => {
      if (scope !== AiDatabaseScope.Custom) {
        return;
      }

      const key = conversation.dataSourceId;
      const connection = key ? await this.connectionsManagerService.requireConnection(key) : null;
      if (!key || !connection) {
        ExecutorInterrupter.interrupt(contexts);
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
        ExecutorInterrupter.interrupt(contexts);
        return;
      }

      await this.aiChatConversationsService.updateConversation(conversation.id, {
        settings: { customObjectIds: result },
      });
    });
  }
}
