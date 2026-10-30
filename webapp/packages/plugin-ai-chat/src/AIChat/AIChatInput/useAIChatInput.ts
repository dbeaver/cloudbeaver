/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useMemo, type DragEvent, type TextareaHTMLAttributes } from 'react';

import { useService } from '@cloudbeaver/core-di';

import { AIChatInputService, type IAIChatInputContext } from './AIChatInputService.js';

export function useAIChatInput({ conversationId, connectionKey, textareaRef }: IAIChatInputContext): {
  input: IAIChatInputContext;
  dragHandlers: Pick<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onDragEnter' | 'onDragOver' | 'onDragLeave' | 'onDrop'>;
} {
  const aiChatInputService = useService(AIChatInputService);
  const input = useMemo<IAIChatInputContext>(() => ({ conversationId, connectionKey, textareaRef }), [conversationId, connectionKey, textareaRef]);

  function handleDrag(event: DragEvent<HTMLTextAreaElement>): void {
    aiChatInputService.onDrag.execute({ input, event });
  }

  return {
    input,
    dragHandlers: {
      onDragEnter: handleDrag,
      onDragOver: handleDrag,
      onDragLeave: handleDrag,
      onDrop: handleDrag,
    },
  };
}
