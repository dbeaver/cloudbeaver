/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { Suspense } from 'react';

import { Placeholder } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { AiMessage } from '@cloudbeaver/core-sdk';

import { AIChatAttachmentsService } from './AIChatAttachmentsService.js';

interface Props {
  message: AiMessage;
}

export const AIChatMessageAttachments = observer<Props>(function AIChatMessageAttachments({ message }) {
  const aiChatAttachmentsService = useService(AIChatAttachmentsService);

  if (message.attachments.length === 0) {
    return null;
  }

  return (
    <div className="tw:flex tw:max-w-full tw:flex-wrap tw:justify-end tw:gap-2">
      {message.attachments.map((attachment, index) => (
        <Suspense key={index} fallback={null}>
          <Placeholder container={aiChatAttachmentsService.messagePreviews} attachment={attachment} />
        </Suspense>
      ))}
    </div>
  );
});
