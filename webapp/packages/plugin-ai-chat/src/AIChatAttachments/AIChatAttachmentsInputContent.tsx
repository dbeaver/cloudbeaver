/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { Suspense, useContext } from 'react';

import { ActionIconButton, Placeholder, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { AIChatContext } from '../AIChat/AIChatContext.js';
import { AIChatInputService, type IAIChatInputProps } from '../AIChat/AIChatInput/AIChatInputService.js';
import { AIChatAttachmentsService } from './AIChatAttachmentsService.js';

export const AIChatAttachmentsInputContent = observer<IAIChatInputProps>(function AIChatAttachmentsInputContent({ input }) {
  const translate = useTranslate();
  const context = useContext(AIChatContext);
  const aiChatInputService = useService(AIChatInputService);
  const disabled = context.disabled || aiChatInputService.isSubmitting(input);
  const aiChatAttachmentsService = useService(AIChatAttachmentsService);
  const state = aiChatAttachmentsService.getState(input);

  if (state.attachments.length === 0) {
    return null;
  }

  return (
    <div className="tw:flex tw:flex-wrap tw:gap-2 tw:mb-2 tw:max-h-40 tw:overflow-auto">
      {state.attachments.map(attachment => {
        const removeLabel = translate('plugin_ai_chat_attachment_remove', undefined, { name: attachment.file.name });

        return (
          <div key={attachment.id} className="tw:relative tw:shrink-0">
            <Suspense fallback={null}>
              <Placeholder container={aiChatAttachmentsService.previews} attachment={attachment} />
            </Suspense>
            <ActionIconButton
              className="tw:absolute! tw:top-0 tw:right-0 tw:bg-(--theme-surface)!"
              name="trash"
              viewBox="0 0 24 24"
              title={removeLabel}
              aria-label={removeLabel}
              disabled={disabled}
              onClick={() => state.remove(attachment)}
            />
          </div>
        );
      })}
    </div>
  );
});
