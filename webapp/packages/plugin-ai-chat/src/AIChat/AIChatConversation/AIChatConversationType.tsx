/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Icon } from '@cloudbeaver/core-blocks';

import type { AIChatConversationInfo } from './AIChatConversationsResource.js';
import { EAIConversationPromptGeneratorId } from '../../EAIConversationPromptGeneratorId.js';

const CONVERSATION_TYPE_ICON: Record<EAIConversationPromptGeneratorId, string> = {
  [EAIConversationPromptGeneratorId.OBJECT_DESCRIBE]: '/icons/ai_conversation_type_describe_object_sm.svg',
  [EAIConversationPromptGeneratorId.SQL_EXPLAIN]: '/icons/ai_conversation_type_explain_query_sm.svg',
  [EAIConversationPromptGeneratorId.SQL_FIX]: '/icons/ai_conversation_type_fix_error_sm.svg',
  [EAIConversationPromptGeneratorId.SQL_EXECUTION_PLAN]: '/icons/ai_conversation_type_explain_query_sm.svg',
};

const DEFAULT_CONVERSATION_TYPE_ICON = '/icons/ai_conversation_type_default_sm.svg';

interface Props {
  conversation: AIChatConversationInfo;
}

export const AIChatConversationType = observer<Props>(function AIChatConversationType({ conversation }) {
  const type = conversation.promptGeneratorId as EAIConversationPromptGeneratorId | undefined;
  let icon = DEFAULT_CONVERSATION_TYPE_ICON;

  if (type && CONVERSATION_TYPE_ICON[type]) {
    icon = CONVERSATION_TYPE_ICON[type];
  }

  return <Icon className="tw:w-4 tw:h-4 tw:shrink-0" name={icon} />;
});
