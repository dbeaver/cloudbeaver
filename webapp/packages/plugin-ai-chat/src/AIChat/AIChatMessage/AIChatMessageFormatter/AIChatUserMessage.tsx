/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import type { PropsWithChildren } from 'react';

import { ActionIconButton, ConfirmationDialog, useClipboard, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import type { AiMessage } from '@cloudbeaver/core-sdk';

import { AIChatMessageService } from '../AIChatMessageService.js';
import { AIChatMessageActions } from '../AIChatMessageActions.js';

interface Props {
  message: AiMessage;
}

export const AIChatUserMessage = observer<PropsWithChildren<Props>>(function AIChatUserMessage({ message, children }) {
  const translate = useTranslate();
  const copy = useClipboard();
  const aiChatMessageService = useService(AIChatMessageService);
  const commonDialogService = useService(CommonDialogService);
  const notificationService = useService(NotificationService);

  async function deleteMessage() {
    const { status } = await commonDialogService.open(ConfirmationDialog, {
      title: 'ui_data_delete_confirmation',
      message: 'plugin_ai_chat_message_delete_confirmation_message',
      confirmActionText: 'ui_delete',
    });

    if (status === DialogueStateResult.Resolved) {
      try {
        await aiChatMessageService.deleteMessage(message.conversationId, message.id);
      } catch (exception: any) {
        notificationService.logException(exception, 'plugin_ai_chat_message_delete_fail');
      }
    }
  }

  return (
    <div
      className="tw:group tw:flex tw:flex-col tw:gap-1 tw:items-end tw:relative tw:break-all"
      role="article"
      aria-label={translate('plugin_ai_chat_message_user_description')}
    >
      <span className="tw:sr-only">{translate('plugin_ai_chat_message_sr_user_description')}</span>
      <div className="tw:flex tw:bg-[var(--theme-primary)] tw:flex-col tw:gap-2 tw:max-w-[80%] tw:px-3 tw:py-2 tw:rounded-lg tw:text-[var(--theme-on-primary)] tw:rounded-br-none">
        {children}
      </div>

      <AIChatMessageActions>
        <ActionIconButton title={translate('ui_copy_to_clipboard')} name="copy" onClick={() => copy(message.displayMessage, true)} />
        <ActionIconButton title={translate('plugin_ai_chat_message_delete_title')} name="/icons/erase.svg" img onClick={deleteMessage} />
      </AIChatMessageActions>
    </div>
  );
});
