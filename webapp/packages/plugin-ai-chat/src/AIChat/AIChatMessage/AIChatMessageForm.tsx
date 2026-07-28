/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext, useState, type PropsWithChildren } from 'react';

import { ActionIconButton, AutoResizeTextarea, Form, s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { getOS, OperatingSystem } from '@cloudbeaver/core-utils';
import { NotificationService } from '@cloudbeaver/core-events';

import { AIChatMessageService } from './AIChatMessageService.js';
import { AIChatConversationsService } from '../AIChatConversation/AIChatConversationsService.js';
import { AIChatContext } from '../AIChatContext.js';
import classes from './AIChatMessageForm.module.css';

interface Props {
  currentConversationId: string | null;
}

export const AIChatMessageForm = observer<PropsWithChildren<Props>>(function AIChatMessageForm({ currentConversationId, children }) {
  const styles = useS(classes);
  const translate = useTranslate();
  const context = useContext(AIChatContext);
  const notificationService = useService(NotificationService);
  const aiChatMessageService = useService(AIChatMessageService);
  const aiChatConversationsService = useService(AIChatConversationsService);

  const [value, setValue] = useState('');

  async function sendMessage() {
    let conversationId = currentConversationId;

    try {
      if (!conversationId) {
        const conversation = await aiChatConversationsService.createConversation(context.connectionKey ?? null);
        conversationId = conversation.id;
      }

      const v = value.trim();

      const message = await aiChatMessageService.sendMessage(conversationId, v);

      if (message) {
        setValue('');
      }
    } catch (exception: any) {
      notificationService.logException(exception, 'plugin_ai_chat_send_message_error');
    }
  }

  function getPlaceholder() {
    const OS = getOS();
    const symbol = OS === OperatingSystem.macOS ? '⌘' : 'Ctrl';

    return translate('plugin_ai_chat_submit_message_placeholder', undefined, { symbol });
  }

  const disabled = !value.trim() || context.disabled;

  return (
    <div className={s(styles, { container: true })}>
      <Form className="tw:flex tw:items-end tw:gap-2" disableEnterSubmit={disabled} contents onSubmit={sendMessage}>
        <div className={s(styles, { textareaContainer: true })}>
          <AutoResizeTextarea
            className={s(styles, { textarea: true })}
            placeholder={getPlaceholder()}
            value={value}
            autoFocus
            onChange={v => setValue(v)}
          />
          <ActionIconButton name="/icons/send.svg" disabled={disabled} img onClick={sendMessage} />
        </div>
      </Form>
      {children}
    </div>
  );
});
