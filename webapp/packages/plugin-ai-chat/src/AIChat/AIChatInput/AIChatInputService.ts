/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { DragEvent, RefObject } from 'react';
import { observable, runInAction } from 'mobx';

import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import type { IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { ExecutionContext, ExecutorInterrupter, SyncExecutor } from '@cloudbeaver/core-executor';
import type { AiSendChatMessageInfoFragment } from '@cloudbeaver/core-sdk';

import { AIChatConversationsService } from '../AIChatConversation/AIChatConversationsService.js';
import { AIChatMessageService } from '../AIChatMessage/AIChatMessageService.js';

export interface IAIChatInputContext {
  readonly conversationId: string | null;
  readonly connectionKey?: IConnectionInfoParams;
  readonly textareaRef: RefObject<HTMLTextAreaElement | null>;
}

export interface IAIChatInputProps {
  input: IAIChatInputContext;
}

export interface IAIChatInputDragEvent extends IAIChatInputProps {
  event: DragEvent<HTMLTextAreaElement>;
}

export interface IAIChatInputValidation extends IAIChatInputProps {
  prompt: string;
  hasContent: boolean;
  valid: boolean;
}

export interface IAIChatInputSubmission extends IAIChatInputProps {
  prompt: string;
}

@injectable(() => [AIChatConversationsService, AIChatMessageService])
export class AIChatInputService {
  readonly onDrag = new SyncExecutor<IAIChatInputDragEvent>();
  readonly onValidate = new SyncExecutor<IAIChatInputValidation>();
  readonly onPrepareSubmit = new SyncExecutor<IAIChatInputSubmission>();
  readonly beforeInput = new PlaceholderContainer<IAIChatInputProps>();
  readonly dragPreview = new PlaceholderContainer<IAIChatInputProps>();

  private readonly submitting = observable.set<RefObject<HTMLTextAreaElement | null>>([], { deep: false });

  constructor(
    private readonly aiChatConversationsService: AIChatConversationsService,
    private readonly aiChatMessageService: AIChatMessageService,
  ) {}

  isSubmitting(input: IAIChatInputContext): boolean {
    return this.submitting.has(input.textareaRef);
  }

  canSubmit(input: IAIChatInputContext, prompt: string): boolean {
    if (this.isSubmitting(input)) {
      return false;
    }

    const data: IAIChatInputValidation = { input, prompt, hasContent: prompt.trim().length > 0, valid: true };
    this.onValidate.execute(data);
    return data.hasContent && data.valid;
  }

  async submit(input: IAIChatInputContext, prompt: string): Promise<AiSendChatMessageInfoFragment | undefined> {
    if (!this.canSubmit(input, prompt) || this.aiChatConversationsService.processing) {
      return;
    }

    runInAction(() => this.submitting.add(input.textareaRef));

    try {
      const data: IAIChatInputSubmission = { input, prompt: prompt.trim() };
      const context = new ExecutionContext(data);
      this.onPrepareSubmit.execute(data, context);

      if (ExecutorInterrupter.isInterrupted(context)) {
        return;
      }

      const conversationId = input.conversationId ?? (await this.aiChatConversationsService.createConversation(input.connectionKey ?? null)).id;
      return await this.aiChatMessageService.sendMessage(conversationId, data.prompt, context);
    } finally {
      runInAction(() => this.submitting.delete(input.textareaRef));
    }
  }
}
