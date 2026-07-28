/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { marked } from 'marked';

import { clsx } from '@dbeaver/ui-kit';
import { ActionIconButton, useClipboard, useTranslate } from '@cloudbeaver/core-blocks';
import type { AiMessage } from '@cloudbeaver/core-sdk';

import { MarkdownFormatter } from '../MarkdownFormatter.js';
import { AIChatMessageActions } from '../AIChatMessageActions.js';
import classes from './AIChatAssistentFormatter.module.css';

interface Props {
  message: AiMessage;
}

export const AIChatAssistentFormatter = observer<Props>(function AIChatAssistentFormatter({ message }) {
  const translate = useTranslate();
  const copy = useClipboard();
  const blocks = useMemo(() => getBlocks(message.content), [message.content]);

  return (
    <div
      className={clsx('tw:group tw:flex tw:flex-col tw:relative', classes['markdown'])}
      role="article"
      aria-label={translate('plugin_ai_chat_message_assistant_description')}
    >
      <span className="tw:sr-only">{translate('plugin_ai_chat_message_sr_assistant_description')}</span>
      {blocks.map((block, index) => {
        const key = `${message.id}-block_${index}`;
        return <MarkdownFormatter key={key} content={block} conversationId={message.conversationId} />;
      })}

      <AIChatMessageActions>
        <ActionIconButton
          title={translate('ui_copy_to_clipboard')}
          name="copy"
          onClick={() => copy(message.displayMessage || message.content, true)}
        />
      </AIChatMessageActions>
    </div>
  );
});

function getBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map(token => token.raw);
}
