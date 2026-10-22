/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { describe, expect, it, vi } from 'vitest';

import { Executor } from '@cloudbeaver/core-executor';
import type { NotificationService } from '@cloudbeaver/core-events';
import type { AIDefaultProfileService, AIProfile, AIProfilesResource } from '@cloudbeaver/plugin-ai-profiles';

import {
  AIChatConversationsService,
  type AIChatContextService,
  type AIChatMessagesResource,
  type AIChatConversationConfig,
  type AIChatConversationInfo,
  type AIChatConversationsResource,
} from '@cloudbeaver/plugin-ai-chat';
import { AIChatConversationProfileService } from './AIChatConversationProfileService.js';

function setup(profile: string | null = 'existing') {
  let conversation = { id: 'chat', profile } as AIChatConversationInfo;
  const resource = {
    onItemDelete: new Executor<string>(),
    get: vi.fn(() => conversation),
    load: vi.fn(() => Promise.resolve(conversation)),
    createConversation: vi.fn((_key: unknown, _generator: unknown, config: AIChatConversationConfig) => {
      conversation = { id: 'new-chat', profile: config.settings?.profile } as AIChatConversationInfo;
      return Promise.resolve(conversation);
    }),
    updateConversation: vi.fn((_id: string, config: AIChatConversationConfig) => {
      conversation = { ...conversation, profile: config.settings?.profile } as AIChatConversationInfo;
      return Promise.resolve(conversation);
    }),
  };
  const defaults = {
    restoreDefaultProfile: vi.fn((): Promise<AIProfile | undefined> => Promise.resolve({ id: 'personal' } as AIProfile)),
    setDefaultProfile: vi.fn<(id: string) => Promise<void>>().mockResolvedValue(undefined),
  };
  const profiles = { has: vi.fn((id: string) => id === 'existing') };
  const messages = { load: vi.fn((): Promise<unknown[]> => Promise.resolve([])) };
  const notifications = { logException: vi.fn() };
  const conversations = new AIChatConversationsService(
    { onContextChange: new Executor() } as unknown as AIChatContextService,
    resource as unknown as AIChatConversationsResource,
    {} as ConstructorParameters<typeof AIChatConversationsService>[2],
    messages as unknown as AIChatMessagesResource,
    notifications as unknown as NotificationService,
  );
  const integration = new AIChatConversationProfileService(
    conversations,
    resource as unknown as AIChatConversationsResource,
    defaults as unknown as AIDefaultProfileService,
    profiles as unknown as AIProfilesResource,
  );
  return { conversations, integration, resource, defaults, messages, profiles };
}

describe('AI chat profile integration', () => {
  it('keeps profile A in chat 1 after choosing B in chat 2 and returning through history', async () => {
    const { conversations, integration, resource, defaults, profiles } = setup();
    profiles.has.mockImplementation(id => id === 'A' || id === 'B');
    const chats = new Map<string, AIChatConversationInfo>();
    let defaultProfile = 'A';
    defaults.restoreDefaultProfile.mockImplementation(() => Promise.resolve({ id: defaultProfile } as AIProfile));
    defaults.setDefaultProfile.mockImplementation(id => {
      defaultProfile = id;
      return Promise.resolve();
    });
    resource.createConversation.mockImplementation((_key, _generator, config) => {
      const chat = { id: `chat-${chats.size + 1}`, profile: config.settings?.profile } as AIChatConversationInfo;
      chats.set(chat.id, chat);
      return Promise.resolve(chat);
    });
    resource.updateConversation.mockImplementation((id, config) => {
      const chat = { ...chats.get(id)!, profile: config.settings?.profile } as AIChatConversationInfo;
      chats.set(id, chat);
      return Promise.resolve(chat);
    });
    resource.get.mockImplementation((...args: unknown[]) => chats.get(args[0] as string)!);

    const first = await conversations.createConversation(null);
    await integration.updateConversationProfile(first.id, 'A');
    const second = await conversations.createConversation(null);
    expect(second.profile).toBe('A');
    await integration.updateConversationProfile(second.id, 'B');
    await conversations.selectConversation(first.id);

    expect(chats.get(first.id)?.profile).toBe('A');
    expect(chats.get(second.id)?.profile).toBe('B');
    expect(defaultProfile).toBe('B');
  });

  it('includes the default profile in the creation request without saving it again', async () => {
    const { conversations, resource, defaults } = setup();

    const conversation = await conversations.createConversation(null);

    expect(resource.createConversation).toHaveBeenCalledWith(null, undefined, { settings: { profile: 'personal' } });
    expect(conversations.currentConversationId).toBe(conversation.id);
    expect(defaults.setDefaultProfile).not.toHaveBeenCalled();
  });

  it('creates a chat without a profile override when no default is available', async () => {
    const { conversations, resource, defaults } = setup();
    defaults.restoreDefaultProfile.mockResolvedValue(undefined);

    await conversations.createConversation(null);

    expect(resource.createConversation).toHaveBeenCalledWith(null, undefined, {});
  });

  it('preserves the valid profile of a selected chat', async () => {
    const { conversations, resource } = setup();

    await conversations.selectConversation('chat');

    expect(resource.updateConversation).not.toHaveBeenCalled();
    expect(resource.load).not.toHaveBeenCalled();
  });

  it.each([null, 'deleted'])('restores the default for a selected chat with profile %s', async profile => {
    const { conversations, resource, defaults } = setup(profile);

    await conversations.selectConversation('chat');

    expect(resource.updateConversation).toHaveBeenCalledWith('chat', { settings: { profile: 'personal' } });
    expect(defaults.setDefaultProfile).not.toHaveBeenCalled();
  });

  it('refreshes a reused empty chat before publishing the new-conversation event', async () => {
    const { conversations, resource, defaults } = setup();
    await conversations.selectConversation('chat');
    const after = vi.fn();
    conversations.onNewConversation.addHandler(event => {
      if (event.stage === 'after') {
        after(event.data);
      }
    });

    const conversation = await conversations.newConversation(null);

    expect(conversation?.profile).toBe('personal');
    expect(after).toHaveBeenCalledWith(expect.objectContaining({ id: 'chat', profile: 'personal' }));
    expect(resource.createConversation).not.toHaveBeenCalled();
    expect(defaults.setDefaultProfile).not.toHaveBeenCalled();
  });

  it('creates a new chat when the current chat contains messages', async () => {
    const { conversations, resource, messages } = setup();
    await conversations.selectConversation('chat');
    messages.load.mockResolvedValue([{}]);

    const conversation = await conversations.newConversation(null);

    expect(conversation?.id).toBe('new-chat');
    expect(resource.updateConversation).not.toHaveBeenCalled();
  });

  it('stays busy until both the chat update and preference save complete', async () => {
    const { integration, defaults, resource } = setup();
    let finish!: () => void;
    defaults.setDefaultProfile.mockImplementation(
      () =>
        new Promise<void>(resolve => {
          finish = resolve;
        }),
    );

    const saving = integration.updateConversationProfile('chat', 'chosen');
    expect(integration.saving).toBe(true);
    expect(defaults.setDefaultProfile).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(defaults.setDefaultProfile).toHaveBeenCalledWith('chosen'));
    expect(resource.updateConversation).toHaveBeenCalledWith('chat', { settings: { profile: 'chosen' } });
    expect(integration.saving).toBe(true);

    finish();
    await expect(saving).resolves.toMatchObject({ profile: 'chosen' });
    expect(integration.saving).toBe(false);
  });

  it('does not save a preference when updating the chat fails', async () => {
    const { integration, defaults, resource } = setup();
    const error = new Error('chat update failed');
    resource.updateConversation.mockRejectedValueOnce(error);

    await expect(integration.updateConversationProfile('chat', 'chosen')).rejects.toBe(error);

    expect(defaults.setDefaultProfile).not.toHaveBeenCalled();
    expect(integration.saving).toBe(false);
  });

  it('propagates a preference save failure and allows retrying', async () => {
    const { integration, defaults } = setup();
    const error = new Error('preference save failed');
    defaults.setDefaultProfile.mockRejectedValueOnce(error);

    await expect(integration.updateConversationProfile('chat', 'chosen')).rejects.toBe(error);
    expect(integration.saving).toBe(false);

    await expect(integration.updateConversationProfile('chat', 'chosen')).resolves.toMatchObject({ profile: 'chosen' });
    expect(defaults.setDefaultProfile).toHaveBeenCalledTimes(2);
    expect(integration.saving).toBe(false);
  });
});
