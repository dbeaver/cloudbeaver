/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useLayoutEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';

import { Loader, useResource, useTranslate } from '@cloudbeaver/core-blocks';

import { AIChatMessagesResource } from './AIChatMessagesResource.js';
import { AIChatMessage } from './AIChatMessage.js';
import { AIChatConversationsResource } from '../AIChatConversation/AIChatConversationsResource.js';

interface Props {
  currentConversationId: string | null;
  disabled?: boolean;
}

export const AIChatMessageList = observer<Props>(function AIChatMessageList({ currentConversationId, disabled }) {
  const ref = useRef<HTMLDivElement>(null);
  const translate = useTranslate();
  const aiChatMessagesResource = useResource(AIChatMessageList, AIChatMessagesResource, currentConversationId);
  const aiChatConversationsResource = useResource(AIChatMessageList, AIChatConversationsResource, currentConversationId);

  const messages = aiChatMessagesResource.data;
  const lastMessage = messages?.[messages.length - 1];

  useLayoutEffect(() => {
    if (ref.current && currentConversationId) {
      ref.current.scrollTo({
        top: ref.current.scrollHeight,
        behavior: 'instant',
      });
    }
  }, [currentConversationId, lastMessage?.id]);

  if (!messages?.length) {
    return <div className="tw:flex tw:flex-1 tw:items-center tw:justify-center">{translate('plugin_ai_chat_no_messages_placeholder')}</div>;
  }

  return (
    <div ref={ref} className="tw:flex-1 tw:overflow-y-auto tw:p-4">
      {messages.map((message, index) => {
        const pinned = index >= messages.length - 2;
        return (
          <AIChatMessage key={message.id} data-pin-actions={pinned} data-hide-actions={disabled} message={message} className="tw:group/message" />
        );
      })}

      {aiChatConversationsResource.data?.waitingForResponse && (
        <Loader className="tw:mx-auto tw:justify-center!" message={translate('plugin_ai_chat_genegate_message_placeholder')} inline small />
      )}
    </div>
  );
});
