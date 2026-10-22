/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { describe, expect, it, vi } from 'vitest';

import { DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { Executor, ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { resourceKeyList, type ResourceKey } from '@cloudbeaver/core-resource';
import {
  AIChatConversationMenuService,
  type AIChatConversationsResource,
  type AIChatMessageService,
  type MessageSendExecutorData,
} from '@cloudbeaver/plugin-ai-chat';
import type { AIProfileCredentialsService, AIProfilesResource } from '@cloudbeaver/plugin-ai-profiles';

import { PluginBootstrap } from './PluginBootstrap.js';

function setup() {
  const menu = new AIChatConversationMenuService();
  const conversations = {
    load: vi.fn().mockResolvedValue({ id: 'chat', profile: 'personal' }),
    values: [
      { id: 'chat', profile: 'personal' },
      { id: 'another', profile: 'other' },
      { id: 'unassigned', profile: null },
    ],
    markOutdated: vi.fn(),
  };
  const messages = { onMessageSend: new Executor<MessageSendExecutorData>() };
  const nextHandler = vi.fn();
  messages.onMessageSend.addHandler(nextHandler);
  const profiles = {
    load: vi.fn().mockResolvedValue({ id: 'personal' }),
    onItemDelete: new Executor<ResourceKey<string>>(),
  };
  const credentials = {
    isRequired: vi.fn().mockReturnValue(true),
    open: vi.fn().mockResolvedValue({ status: DialogueStateResult.Resolved }),
  };
  const bootstrap = new PluginBootstrap(
    menu,
    conversations as unknown as AIChatConversationsResource,
    messages as unknown as AIChatMessageService,
    profiles as unknown as AIProfilesResource,
    credentials as unknown as AIProfileCredentialsService,
  );
  bootstrap.register();
  return { menu, conversations, messages, profiles, credentials, nextHandler };
}

describe('AI chat profiles plugin', () => {
  it('contributes the profile menu section', () => {
    expect(setup().menu.sections.get()).toHaveLength(1);
  });

  it('checks credentials before other message handlers', async () => {
    const { messages, credentials, nextHandler } = setup();
    credentials.open.mockImplementation(() => {
      expect(nextHandler).not.toHaveBeenCalled();
      return Promise.resolve({ status: DialogueStateResult.Resolved });
    });

    const contexts = await messages.onMessageSend.execute({ stage: 'before', data: { conversationId: 'chat' } });

    expect(credentials.open).toHaveBeenCalledWith('personal');
    expect(ExecutorInterrupter.isInterrupted(contexts)).toBe(false);
    expect(nextHandler).toHaveBeenCalledOnce();
  });

  it.each([{ status: DialogueStateResult.Rejected }, undefined])('interrupts sending when authorization is cancelled (%s)', async result => {
    const { messages, credentials, nextHandler } = setup();
    credentials.open.mockResolvedValue(result);

    const contexts = await messages.onMessageSend.execute({ stage: 'before', data: { conversationId: 'chat' } });

    expect(ExecutorInterrupter.isInterrupted(contexts)).toBe(true);
    expect(nextHandler).not.toHaveBeenCalled();
  });

  it('does not prompt for credentials when they are not required', async () => {
    const { messages, credentials, nextHandler } = setup();
    credentials.isRequired.mockReturnValue(false);

    await messages.onMessageSend.execute({ stage: 'before', data: { conversationId: 'chat' } });

    expect(credentials.open).not.toHaveBeenCalled();
    expect(nextHandler).toHaveBeenCalledOnce();
  });

  it('allows chats without an assigned profile', async () => {
    const { messages, conversations, profiles, credentials, nextHandler } = setup();
    conversations.load.mockResolvedValue({ id: 'chat', profile: null });

    await messages.onMessageSend.execute({ stage: 'before', data: { conversationId: 'chat' } });

    expect(profiles.load).not.toHaveBeenCalled();
    expect(credentials.open).not.toHaveBeenCalled();
    expect(nextHandler).toHaveBeenCalledOnce();
  });

  it('propagates authorization errors without continuing to send', async () => {
    const { messages, credentials, nextHandler } = setup();
    const error = new Error('authorization failed');
    credentials.open.mockRejectedValue(error);

    await expect(messages.onMessageSend.execute({ stage: 'before', data: { conversationId: 'chat' } })).rejects.toBe(error);

    expect(nextHandler).not.toHaveBeenCalled();
  });

  it('invalidates only conversations using deleted profiles', async () => {
    const { conversations, profiles } = setup();

    await profiles.onItemDelete.execute(resourceKeyList(['personal']));

    expect(conversations.markOutdated).toHaveBeenCalledWith(resourceKeyList(['chat']));
  });
});
