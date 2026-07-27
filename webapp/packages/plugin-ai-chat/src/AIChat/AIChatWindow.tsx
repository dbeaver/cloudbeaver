/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { Suspense, useEffect } from 'react';

import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-blocks';

import { AIChatMessageForm } from './AIChatMessage/AIChatMessageForm.js';
import { AIChatHeader } from './AIChatHeader.js';
import { AIChatMessageList } from './AIChatMessage/AIChatMessageList.js';
import { AIChatConversationsService } from './AIChatConversation/AIChatConversationsService.js';
import { AIChatContextService } from './AIChatContext/AIChatContextService.js';
import { AIChatContext } from './AIChatContext.js';
import { AIChatConversationsResource } from './AIChatConversation/AIChatConversationsResource.js';
import { AIChatConversationMetrics } from './AIChatConversation/AIChatConversationMetrics.js';
import { AIChatService } from './AIChatService.js';

export const AIChatWindow = observer(function AIChatWindow() {
  const translate = useTranslate();
  const aiChatService = useService(AIChatService);
  const aiChatContextService = useService(AIChatContextService);
  const aiChatConversationsService = useService(AIChatConversationsService);
  const aiChatConversationsResource = useService(AIChatConversationsResource);

  const context = aiChatContextService.currentContext;
  const conversationId = aiChatConversationsService.currentConversationId;
  const disabled = aiChatConversationsService.processing;

  useEffect(() => () => aiChatConversationsResource.markOutdated(), []);

  return (
    <AIChatContext value={{ connectionKey: context?.connectionKey, catalog: context?.catalog, schema: context?.schema, disabled }}>
      <div className="tw:flex tw:flex-1 tw:flex-col tw:overflow-auto">
        <AIChatHeader currentConversationId={conversationId} />
        {conversationId && aiChatService.metrics && (
          <Suspense>
            <AIChatConversationMetrics conversationId={conversationId} />
          </Suspense>
        )}
        <AIChatMessageList currentConversationId={conversationId} disabled={disabled} />
        <AIChatMessageForm currentConversationId={conversationId}>
          <div className="tw:text-(--theme-text-hint-on-light) tw:text-xs tw:text-center tw:mt-1">{translate('plugin_ai_chat_ai_notice')}</div>
        </AIChatMessageForm>
      </div>
    </AIChatContext>
  );
});
