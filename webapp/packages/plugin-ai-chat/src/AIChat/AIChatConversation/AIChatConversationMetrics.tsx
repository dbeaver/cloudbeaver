/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { useResource, useTranslate } from '@cloudbeaver/core-blocks';

import { AIChatConversationMetricsResource } from './AIChatConversationMetricsResource.js';

interface Props {
  conversationId: string;
}

export const AIChatConversationMetrics = observer<Props>(function AIChatConversationMetrics({ conversationId }) {
  const translate = useTranslate();
  const aiChatConversationMetricsResource = useResource(AIChatConversationMetrics, AIChatConversationMetricsResource, conversationId);

  const input = aiChatConversationMetricsResource.data?.metrics?.totalInputTokens ?? 0;
  const output = aiChatConversationMetricsResource.data?.metrics?.totalOutputTokens ?? 0;

  return (
    <div className="tw:px-4 tw:py-0.5 theme-border-color-background tw:border-b">
      <div className="tw:flex tw:items-center tw:gap-1">
        <div className="tw:flex">
          <div>{input}↑</div>
          <span>/</span>
          <div>{output}↓</div>
        </div>
        <span>{translate('plugin_ai_chat_settings_metrics_tokens')}</span>
      </div>
    </div>
  );
});
