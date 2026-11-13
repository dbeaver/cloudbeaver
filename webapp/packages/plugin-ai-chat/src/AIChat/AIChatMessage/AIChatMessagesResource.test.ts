/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { describe, expect, test, vi } from 'vitest';

import type { UserInfoResource } from '@cloudbeaver/core-authentication';
import { SyncExecutor } from '@cloudbeaver/core-executor';
import type { LocalizationService } from '@cloudbeaver/core-localization';
import { AiMessageType, CbServerEventId, type GraphQLService, type WsaiChatMessageEvent } from '@cloudbeaver/core-sdk';

import type { AIChatFunctionRegistryService } from '../../AIChatFunctionRegistryService.js';
import type { AIChatConversationsResource } from '../AIChatConversation/AIChatConversationsResource.js';
import type { AIChatMessageEventHandler, IAiChatMessageEvent } from './AIChatMessageEventHandler.js';
import { AIChatMessagesResource } from './AIChatMessagesResource.js';

function setup({ system = false, interaction = false } = {}) {
  let receiveMessage: (event: IAiChatMessageEvent) => void = () => {};
  const emit = vi.fn();
  const eventHandler = {
    onEvent: (eventId: CbServerEventId, handler: (event: IAiChatMessageEvent) => void) => {
      if (eventId === CbServerEventId.CbAiChatMessage) {
        receiveMessage = handler;
      }
    },
    emit,
  } as unknown as AIChatMessageEventHandler;

  const functionRegistry = {
    getFunction: () => ({ system }),
    isInteraction: () => interaction,
  } as unknown as AIChatFunctionRegistryService;

  const conversations = {
    onItemDelete: new SyncExecutor(),
    onDataOutdated: new SyncExecutor(),
    get: () => undefined,
  } as unknown as AIChatConversationsResource;

  const userInfo = { onUserChange: new SyncExecutor() } as unknown as UserInfoResource;
  const resource = new AIChatMessagesResource(
    {} as GraphQLService,
    {} as LocalizationService,
    eventHandler,
    functionRegistry,
    conversations,
    userInfo,
  );

  return {
    resource,
    emit,
    receive: (required?: boolean) => {
      receiveMessage({
        id: CbServerEventId.CbAiChatMessage,
        content: '',
        displayMessage: '',
        time: '2026-11-06T12:00:00',
        messageId: '1',
        conversationId: 'conversation',
        role: AiMessageType.Confirmation,
        attachments: [],
        functionConfirmation: { functionCalls: [{ id: 'call', functionName: 'db_uiOpenDBeaverSQLEditor', arguments: {} }] },
        functionConfirmationRequired: required,
      } as WsaiChatMessageEvent);
    },
  };
}

const param = { id: '1', conversationId: 'conversation' };

describe('AI tool approval', () => {
  test('automatically approves a non-system tool allowed by Desktop settings', () => {
    const { resource, receive, emit } = setup();
    receive(false);

    expect(resource.isFunctionConfirmationRequired(param)).toBe(false);
    expect(emit).toHaveBeenCalledWith(expect.objectContaining({ confirmedFunctionCalls: ['call'] }));
  });

  test('keeps a batch pending when the server requires approval', () => {
    const { resource, receive, emit } = setup();
    receive(true);

    expect(resource.isFunctionConfirmationRequired(param)).toBe(true);
    expect(emit).not.toHaveBeenCalled();
  });

  test('honors an explicit ask setting even for system tools', () => {
    const { resource, receive, emit } = setup({ system: true });
    receive(true);

    expect(resource.isFunctionConfirmationRequired(param)).toBe(true);
    expect(emit).not.toHaveBeenCalled();
  });

  test('does not automatically answer an interactive question', () => {
    const { receive, emit } = setup({ interaction: true });
    receive(false);

    expect(emit).not.toHaveBeenCalled();
  });

  test.each([true, false])('preserves legacy behavior without server metadata, system=%s', system => {
    const { resource, receive, emit } = setup({ system });
    receive();

    expect(resource.isFunctionConfirmationRequired(param)).toBe(!system);
    expect(emit).toHaveBeenCalledTimes(system ? 1 : 0);
  });

  test('ignores a duplicate live event', () => {
    const { receive, emit } = setup();
    receive(false);
    receive(false);

    expect(emit).toHaveBeenCalledTimes(1);
  });
});
