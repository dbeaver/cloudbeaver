/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext, useEffect } from 'react';

import { useService } from '@cloudbeaver/core-di';

import { AIChatContext } from '../AIChat/AIChatContext.js';
import { AIChatInputService, type IAIChatInputProps } from '../AIChat/AIChatInput/AIChatInputService.js';
import { AIChatAttachmentsService } from './AIChatAttachmentsService.js';

export const AIChatAttachmentsDropPreview = observer<IAIChatInputProps>(function AIChatAttachmentsDropPreview({ input }) {
  const context = useContext(AIChatContext);
  const aiChatInputService = useService(AIChatInputService);
  const disabled = context.disabled || aiChatInputService.isSubmitting(input);
  const aiChatAttachmentsService = useService(AIChatAttachmentsService);
  const state = aiChatAttachmentsService.getState(input);

  useEffect(() => {
    if (disabled) {
      state.setDragOver(false);
    }

    return () => state.setDragOver(false);
  }, [state, disabled]);

  if (disabled || !state.dragOver) {
    return null;
  }

  return (
    <div
      className="tw:absolute tw:inset-0 tw:pointer-events-none tw:rounded-md tw:outline-2 tw:outline-dashed tw:outline-(--theme-primary) tw:-outline-offset-2"
      aria-hidden="true"
    />
  );
});
