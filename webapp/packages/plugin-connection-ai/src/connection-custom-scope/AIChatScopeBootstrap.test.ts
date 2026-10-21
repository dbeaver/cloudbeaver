/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { describe, expect, it, vi } from 'vitest';

import type { ConnectionsManagerService } from '@cloudbeaver/core-connections';
import { DialogueStateResult, type CommonDialogService } from '@cloudbeaver/core-dialogs';
import { Executor } from '@cloudbeaver/core-executor';
import { AiDatabaseScope } from '@cloudbeaver/core-sdk';
import { AIChatConversationsService } from '@cloudbeaver/plugin-ai-chat';

import type { ConnectionInfoAiResource } from '../ConnectionInfoAiResource.js';
import { AIChatScopeBootstrap } from './AIChatScopeBootstrap.js';

function setup() {
  type Conversation = Parameters<AIChatConversationsService['selectScope']>[0];
  const conversation = {
    id: 'conversation',
    dataSourceId: { projectId: 'project', connectionId: 'connection' },
    settings: { customObjectIds: ['selected-table'] },
  } as Conversation;
  const updateConversation = vi.fn().mockResolvedValue(conversation);
  const updateConversationScope = vi.fn().mockResolvedValue(undefined);
  const conversations = {
    onScopeSelect: new Executor<{ conversation: Conversation; scope: AiDatabaseScope }>(),
    updateConversation,
    updateConversationScope,
  } as unknown as AIChatConversationsService;
  const requireConnection = vi.fn().mockResolvedValue({ nodePath: 'connection-root' });
  const refresh = vi.fn().mockResolvedValue({ scope: AiDatabaseScope.Custom, customObjectIds: ['allowed-schema'] });
  const open = vi.fn().mockResolvedValue({ status: DialogueStateResult.Resolved, result: ['new-table'] });

  new AIChatScopeBootstrap(
    conversations,
    { requireConnection } as unknown as ConnectionsManagerService,
    { refresh } as unknown as ConnectionInfoAiResource,
    { open } as unknown as CommonDialogService,
  ).register();

  return {
    select: (scope = AiDatabaseScope.Custom) => AIChatConversationsService.prototype.selectScope.call(conversations, conversation, scope),
    updateConversation,
    updateConversationScope,
    requireConnection,
    refresh,
    open,
  };
}

describe('connection AI chat scope registration', () => {
  it('restricts the picker to the connection scope and saves objects before changing scope', async () => {
    const test = setup();
    await test.select();

    expect(test.refresh).toHaveBeenCalledWith({ projectId: 'project', connectionId: 'connection' });
    expect(test.open).toHaveBeenCalledWith(expect.anything(), {
      rootId: 'connection-root',
      selectedIds: ['selected-table'],
      title: 'plugin_ai_chat_scope_custom_dialog_title',
      allowedIds: ['allowed-schema'],
    });
    expect(test.updateConversation).toHaveBeenCalledWith('conversation', { settings: { customObjectIds: ['new-table'] } });
    expect(test.updateConversationScope).toHaveBeenCalledWith('conversation', AiDatabaseScope.Custom);
    expect(test.updateConversation.mock.invocationCallOrder[0]).toBeLessThan(test.updateConversationScope.mock.invocationCallOrder[0]!);
  });

  it('does not change objects or scope when the dialog is cancelled', async () => {
    const test = setup();
    test.open.mockResolvedValue({ status: DialogueStateResult.Rejected });
    await test.select();

    expect(test.updateConversation).not.toHaveBeenCalled();
    expect(test.updateConversationScope).not.toHaveBeenCalled();
  });

  it('does not change scope when connecting is cancelled', async () => {
    const test = setup();
    test.requireConnection.mockResolvedValue(null);
    await test.select();

    expect(test.open).not.toHaveBeenCalled();
    expect(test.updateConversationScope).not.toHaveBeenCalled();
  });

  it('preserves an explicitly empty allowed scope and allows clearing the selection', async () => {
    const test = setup();
    test.refresh.mockResolvedValue({ scope: AiDatabaseScope.Custom, customObjectIds: [] });
    test.open.mockResolvedValue({ status: DialogueStateResult.Resolved, result: [] });
    await test.select();

    expect(test.open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ allowedIds: [] }));
    expect(test.updateConversation).toHaveBeenCalledWith('conversation', { settings: { customObjectIds: [] } });
    expect(test.updateConversationScope).toHaveBeenCalledWith('conversation', AiDatabaseScope.Custom);
  });

  it('does not restrict the picker for an unrestricted connection', async () => {
    const test = setup();
    test.refresh.mockResolvedValue({ scope: AiDatabaseScope.CurrentDatasource });
    await test.select();

    expect(test.open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ allowedIds: null }));
  });

  it('does not update scope when saving the selected objects fails', async () => {
    const test = setup();
    test.updateConversation.mockRejectedValue(new Error('Save failed'));

    await expect(test.select()).rejects.toThrow('Save failed');
    expect(test.updateConversationScope).not.toHaveBeenCalled();
  });

  it('changes built-in scopes without opening the picker', async () => {
    const test = setup();
    await test.select(AiDatabaseScope.CurrentSchema);

    expect(test.open).not.toHaveBeenCalled();
    expect(test.refresh).not.toHaveBeenCalled();
    expect(test.updateConversation).not.toHaveBeenCalled();
    expect(test.updateConversationScope).toHaveBeenCalledWith('conversation', AiDatabaseScope.CurrentSchema);
  });
});
