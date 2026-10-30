/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { Suspense, useContext, useRef, useState, type PropsWithChildren } from 'react';

import { ActionIconButton, AutoResizeTextarea, Form, Placeholder, s, useExecutor, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { getOS, OperatingSystem } from '@cloudbeaver/core-utils';
import { NotificationService } from '@cloudbeaver/core-events';
import { Command } from '@dbeaver/ui-kit';

import { AIChatConversationsService } from '../AIChatConversation/AIChatConversationsService.js';
import { AIChatContext } from '../AIChatContext.js';
import { AIChatInputService } from '../AIChatInput/AIChatInputService.js';
import { useAIChatInput } from '../AIChatInput/useAIChatInput.js';
import classes from './AIChatMessageForm.module.css';

interface Props {
  currentConversationId: string | null;
}

export const AIChatMessageForm = observer<PropsWithChildren<Props>>(function AIChatMessageForm({ currentConversationId, children }) {
  const styles = useS(classes);
  const translate = useTranslate();
  const context = useContext(AIChatContext);
  const notificationService = useService(NotificationService);
  const aiChatConversationsService = useService(AIChatConversationsService);
  const aiChatInputService = useService(AIChatInputService);

  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { input, dragHandlers } = useAIChatInput({ conversationId: currentConversationId, connectionKey: context.connectionKey, textareaRef });
  const submitting = aiChatInputService.isSubmitting(input);

  useExecutor({
    executor: aiChatConversationsService.onNewConversation,
    handlers: [
      ({ stage }) => {
        if (stage === 'after') {
          textareaRef.current?.focus();
        }
      },
    ],
  });

  async function sendMessage() {
    const submittedValue = value;
    try {
      const message = await aiChatInputService.submit(input, submittedValue);

      if (message) {
        setValue(current => (current === submittedValue ? '' : current));
      }
    } catch (exception: any) {
      notificationService.logException(exception, 'plugin_ai_chat_send_message_error');
    }
  }

  async function cancel() {
    if (currentConversationId) {
      try {
        await aiChatConversationsService.cancelConversation(currentConversationId);
      } catch (exception: any) {
        notificationService.logException(exception, 'plugin_ai_chat_conversation_cancel_failed');
      }
    }
  }

  function getPlaceholder() {
    const OS = getOS();
    const symbol = OS === OperatingSystem.macOS ? '⌘' : 'Ctrl';

    return translate('plugin_ai_chat_submit_message_placeholder', undefined, { symbol });
  }

  const disabled = context.disabled || !aiChatInputService.canSubmit(input, value);

  return (
    <div className={s(styles, { container: true })}>
      <Suspense fallback={null}>
        <Placeholder container={aiChatInputService.beforeInput} input={input} />
      </Suspense>
      <Form
        className="tw:flex tw:items-end tw:gap-2"
        disableEnterSubmit={disabled}
        contents
        onSubmit={aiChatConversationsService.processing ? cancel : sendMessage}
      >
        <div className={s(styles, { textareaContainer: true }, 'tw:relative')}>
          <AutoResizeTextarea
            {...dragHandlers}
            ref={textareaRef}
            className={s(styles, { textarea: true })}
            placeholder={getPlaceholder()}
            value={value}
            readOnly={aiChatConversationsService.processing || submitting}
            autoFocus
            onChange={v => setValue(v)}
          />
          <Suspense fallback={null}>
            <Placeholder container={aiChatInputService.dragPreview} input={input} />
          </Suspense>
          {!aiChatConversationsService.processing ? (
            <ActionIconButton name="/icons/send.svg" disabled={disabled} img onClick={sendMessage} />
          ) : (
            <Command
              className="tw:cursor-pointer tw:w-10 tw:h-10 tw:bg-[var(--theme-primary)] tw:rounded-md tw:flex tw:items-center tw:justify-center tw:focus:opacity-80 tw:hover:opacity-80 tw:transition-opacity"
              aria-label={translate('ui_processing_cancel')}
              onClick={cancel}
            >
              <div className="tw:w-3 tw:h-3 tw:bg-[var(--theme-surface)] tw:rounded-xs" />
            </Command>
          )}
        </div>
      </Form>
      {children}
    </div>
  );
});
