/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createAction } from '@cloudbeaver/core-view';

export const ACTION_TOGGLE_AI_CHAT = createAction('ai-chat-toggle', {
  label: 'plugin_ai_chat_label',
  tooltip: 'plugin_ai_chat_tooltip',
  icon: '/icons/ai_sm.svg',
});
