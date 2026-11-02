/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { ActionIconButton, useTranslate } from '@cloudbeaver/core-blocks';
import { promptForFiles } from '@cloudbeaver/core-browser';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';

import { AIChatContext } from '../AIChat/AIChatContext.js';
import type { IAIChatInputProps } from '../AIChat/AIChatInput/AIChatInputService.js';
import { AIChatAttachmentsService } from './AIChatAttachmentsService.js';

export const AIChatAttachmentsButton = observer<IAIChatInputProps>(function AIChatAttachmentsButton({ input }) {
  const translate = useTranslate();

  const { disabled } = useContext(AIChatContext);

  const aiChatAttachmentsService = useService(AIChatAttachmentsService);
  const notificationService = useService(NotificationService);

  const label = translate('plugin_ai_chat_attachment_add');

  async function selectFiles() {
    try {
      const files = await promptForFiles({ multiple: true, accept: aiChatAttachmentsService.accept });

      if (files.length === 0) {
        return;
      }

      await aiChatAttachmentsService.attachFiles(input, files);
      input.textareaRef.current?.focus();
    } catch (exception: any) {
      notificationService.logException(exception, 'plugin_ai_chat_attachment_load_error');
    }
  }

  return (
    <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-2">
      <ActionIconButton name="/icons/attach.svg" title={label} aria-label={label} disabled={disabled} type="button" img onClick={selectFiles} />
      <span className="tw:truncate tw:text-xs tw:text-(--theme-text-hint-on-light)">{translate('plugin_ai_chat_attachment_drop_hint')}</span>
    </div>
  );
});
