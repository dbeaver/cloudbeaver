/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Cell, IconOrImage, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { ACTION_TOGGLE_AI_CHAT } from './actions/ACTION_TOGGLE_AI_CHAT.js';
import { AIChatService } from './AIChat/AIChatService.js';

export const WelcomeAIChat = observer(function WelcomeAIChat() {
  const translate = useTranslate();
  const aiChatService = useService(AIChatService);

  return (
    <Cell
      before={<IconOrImage icon={ACTION_TOGGLE_AI_CHAT.info.icon ?? '/icons/ai.png'} />}
      description={translate(ACTION_TOGGLE_AI_CHAT.info.tooltip)}
      className="tw:cursor-pointer tw:rounded-sm tw:overflow-hidden"
      aria-label={translate(ACTION_TOGGLE_AI_CHAT.info.tooltip)}
      big
      onClick={() => aiChatService.togglePanel()}
    >
      {translate(ACTION_TOGGLE_AI_CHAT.info.label)}
    </Cell>
  );
});
