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
import type { IAIChatInputProps } from '../AIChat/AIChatInput/AIChatInputService.js';
import { AIChatAttachmentsService } from './AIChatAttachmentsService.js';

export const AIChatAttachmentsInputContent = observer<IAIChatInputProps>(function AIChatAttachmentsInputContent({ input }) {
  const translate = useTranslate();
  const context = useContext(AIChatContext);
  const aiChatAttachmentsService = useService(AIChatAttachmentsService);
  const state = aiChatAttachmentsService.getState(input);

  if (state.attachments.length === 0) {
    return null;
  }

  return (
    <div className="tw:flex tw:flex-wrap tw:gap-2 tw:max-h-40 tw:overflow-auto tw:p-2 tw:pb-0">
      {state.attachments.map(attachment => {
        const removeLabel = translate('plugin_ai_chat_attachment_remove', undefined, { name: attachment.file.name });

        return (
          <div key={attachment.id} className="tw:group/attachment tw:relative tw:shrink-0">
            <Suspense fallback={null}>
              <Placeholder container={aiChatAttachmentsService.previews} attachment={attachment} />
            </Suspense>
            <ActionIconButton
              className="tw:absolute! tw:top-0.5 tw:right-0.5 tw:m-0! tw:size-5! tw:rounded-full! tw:bg-(--theme-on-surface)! tw:text-(--theme-surface)! tw:pointer-events-none tw:opacity-0 tw:group-hover/attachment:pointer-events-auto tw:group-hover/attachment:opacity-100 tw:group-focus-within/attachment:pointer-events-auto tw:group-focus-within/attachment:opacity-100 tw:focus-visible:outline-2! tw:focus-visible:outline-solid! tw:focus-visible:outline-(--theme-primary)! tw:transition-opacity tw:duration-150 tw:motion-reduce:transition-none"
              name="cross"
              viewBox="0 0 16 16"
              type="button"
              title={removeLabel}
              aria-label={removeLabel}
              disabled={context.disabled}
              onClick={() => state.remove(attachment)}
            />
          </div>
        );
      })}
    </div>
  );
});
