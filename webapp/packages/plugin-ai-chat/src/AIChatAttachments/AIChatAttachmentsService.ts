/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { PlaceholderContainer, type PlaceholderComponent } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import type { AiChatAttachmentInput } from '@cloudbeaver/core-sdk';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { observable, runInAction, type ObservableMap } from 'mobx';

import type {
  IAIChatInputContext,
  IAIChatInputDragEvent,
  IAIChatInputSubmission,
  IAIChatInputValidation,
} from '../AIChat/AIChatInput/AIChatInputService.js';
import type { MessageSendExecutorData } from '../AIChat/AIChatMessage/AIChatMessageService.js';
import { aiChatMessageRequestContext } from '../AIChat/AIChatMessage/aiChatMessageRequestContext.js';
import { AIChatAttachmentsState } from './AIChatAttachmentsState.js';

export interface IAIChatAttachment {
  readonly id: string;
  readonly type: string;
  readonly file: File;
}

export interface IAIChatAttachmentProps {
  attachment: IAIChatAttachment;
}

export interface IAIChatAttachmentHandler {
  readonly id: string;
  readonly preview: PlaceholderComponent<IAIChatAttachmentProps>;
  canHandle(file: File): boolean;
  create(file: File): IAIChatAttachment | Promise<IAIChatAttachment>;
  validate?(attachments: readonly IAIChatAttachment[]): void;
  serialize(attachment: IAIChatAttachment): Promise<AiChatAttachmentInput>;
}

interface IAIChatAttachmentsSubmission {
  input: IAIChatInputContext;
  state: AIChatAttachmentsState;
  attachments: readonly IAIChatAttachment[];
}

function aiChatAttachmentsSubmissionContext(): { submission: IAIChatAttachmentsSubmission | null } {
  return { submission: null };
}

@injectable(() => [NotificationService])
export class AIChatAttachmentsService {
  readonly previews = new PlaceholderContainer<IAIChatAttachmentProps>();

  private readonly handlers = new Map<string, IAIChatAttachmentHandler>();
  private readonly states = new WeakMap<IAIChatInputContext['textareaRef'], ObservableMap<string, AIChatAttachmentsState>>();

  constructor(private readonly notificationService: NotificationService) {}

  getState(input: IAIChatInputContext): AIChatAttachmentsState {
    const states = this.getStates(input);
    const key = this.getStateKey(input);
    let state = states.get(key);

    if (!state) {
      const newState = new AIChatAttachmentsState();
      runInAction(() => states.set(key, newState));
      state = newState;
    }

    return state;
  }

  register(handler: IAIChatAttachmentHandler): void {
    if (this.handlers.has(handler.id)) {
      throw new Error(`AI chat attachment handler is already registered: ${handler.id}`);
    }

    this.handlers.set(handler.id, handler);
    this.previews.add(handler.preview, undefined, ({ attachment }) => attachment.type !== handler.id);
  }

  getHandler(file: File): IAIChatAttachmentHandler | undefined {
    return Array.from(this.handlers.values()).find(handler => handler.canHandle(file));
  }

  validateInput(data: IAIChatInputValidation): void {
    const state = this.getState(data.input);
    data.hasContent ||= state.attachments.length > 0;
    data.valid &&= !state.loading;
  }

  prepareSubmission({ input }: IAIChatInputSubmission, contexts: IExecutionContextProvider<IAIChatInputSubmission>): void {
    const state = this.getState(input);
    const attachments = [...state.attachments];
    const groups = new Map<string, IAIChatAttachment[]>();

    for (const attachment of attachments) {
      const group = groups.get(attachment.type) ?? [];
      group.push(attachment);
      groups.set(attachment.type, group);
    }

    for (const [type, group] of groups) {
      this.getRegisteredHandler(type).validate?.(group);
    }

    contexts.getContext(aiChatAttachmentsSubmissionContext).submission = { input, state, attachments };
  }

  async handleMessageSend(data: MessageSendExecutorData, contexts: IExecutionContextProvider<MessageSendExecutorData>): Promise<void> {
    const { submission } = contexts.getContext(aiChatAttachmentsSubmissionContext);

    if (!submission) {
      return;
    }

    if (data.stage === 'after') {
      for (const attachment of submission.attachments) {
        submission.state.remove(attachment);
      }
      return;
    }

    runInAction(() => {
      const states = this.getStates(submission.input);
      states.set(this.getStateKey(submission.input, data.data.conversationId), submission.state);

      if (submission.input.conversationId === null) {
        states.delete(this.getStateKey(submission.input));
      }
    });

    if (submission.attachments.length > 0) {
      const attachments: AiChatAttachmentInput[] = [];

      for (const attachment of submission.attachments) {
        attachments.push(await this.getRegisteredHandler(attachment.type).serialize(attachment));
      }

      contexts.getContext(aiChatMessageRequestContext).attachments = attachments;
    }
  }

  handleInputDrag({ input, event }: IAIChatInputDragEvent): void {
    const state = this.getState(input);

    if (event.type === 'dragleave') {
      state.setDragOver(false);
      return;
    }

    if (!event.dataTransfer?.types.includes('Files') || event.defaultPrevented) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const textarea = event.currentTarget;
    const disabled = textarea.disabled || textarea.readOnly;

    if (event.type === 'drop') {
      state.setDragOver(false);

      if (!disabled) {
        void this.attachFiles(input, Array.from(event.dataTransfer.files));
        textarea.focus();
      }

      return;
    }

    event.dataTransfer.dropEffect = disabled ? 'none' : 'copy';
    state.setDragOver(!disabled);
  }

  private async attachFiles(input: IAIChatInputContext, files: File[]): Promise<void> {
    const state = this.getState(input);
    state.startLoading();

    try {
      for (const file of files) {
        try {
          const handler = this.getHandler(file);

          if (handler) {
            state.add(await handler.create(file));
          }
        } catch (exception: any) {
          this.notificationService.logException(exception, 'plugin_ai_chat_attachment_load_error');
        }
      }
    } finally {
      state.finishLoading();
    }
  }

  private getRegisteredHandler(type: string): IAIChatAttachmentHandler {
    const handler = this.handlers.get(type);

    if (!handler) {
      throw new Error(`AI chat attachment handler is not registered: ${type}`);
    }

    return handler;
  }

  private getStates(input: IAIChatInputContext): ObservableMap<string, AIChatAttachmentsState> {
    let states = this.states.get(input.textareaRef);

    if (!states) {
      states = observable.map<string, AIChatAttachmentsState>(undefined, { deep: false });
      this.states.set(input.textareaRef, states);
    }

    return states;
  }

  private getStateKey(input: IAIChatInputContext, conversationId = input.conversationId): string {
    return JSON.stringify([conversationId, input.connectionKey?.projectId, input.connectionKey?.connectionId]);
  }
}
