/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent, PlaceholderContainer, type PlaceholderComponent } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import type { AiChatAttachment, AiChatAttachmentInput } from '@cloudbeaver/core-sdk';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';

import {
  AIChatInputService,
  type IAIChatInputContext,
  type IAIChatInputDragEvent,
  type IAIChatInputSubmission,
  type IAIChatInputValidation,
} from '../AIChat/AIChatInput/AIChatInputService.js';
import { AIChatMessageService, type MessageSendExecutorData } from '../AIChat/AIChatMessage/AIChatMessageService.js';
import { aiChatMessageRequestContext } from '../AIChat/AIChatMessage/aiChatMessageRequestContext.js';
import type { AIChatAttachmentsState } from './AIChatAttachmentsState.js';

const AIChatAttachmentsDropPreview = importLazyComponent(() => import('./AIChatAttachmentsDropPreview.js').then(m => m.AIChatAttachmentsDropPreview));
const AIChatAttachmentsInputContent = importLazyComponent(() =>
  import('./AIChatAttachmentsInputContent.js').then(m => m.AIChatAttachmentsInputContent),
);

export interface IAIChatAttachment {
  readonly id: string;
  readonly type: string;
  readonly file: File;
}

export interface IAIChatAttachmentProps {
  attachment: IAIChatAttachment;
}

export interface IAIChatMessageAttachmentProps {
  attachment: AiChatAttachment;
}

export interface IAIChatAttachmentHandler {
  readonly id: string;
  readonly accept?: string;
  readonly preview: PlaceholderComponent<IAIChatAttachmentProps>;
  readonly messagePreview?: PlaceholderComponent<IAIChatMessageAttachmentProps>;
  canHandle(file: File): boolean;
  create(file: File): IAIChatAttachment | Promise<IAIChatAttachment>;
  validate?(attachments: readonly IAIChatAttachment[]): void;
  serialize(attachment: IAIChatAttachment): Promise<AiChatAttachmentInput>;
}

interface IAIChatAttachmentsSubmission {
  state: AIChatAttachmentsState;
  attachments: readonly IAIChatAttachment[];
}

function aiChatAttachmentsSubmissionContext(): { submission: IAIChatAttachmentsSubmission | null } {
  return { submission: null };
}

@injectable(() => [NotificationService, AIChatInputService, AIChatMessageService])
export class AIChatAttachmentsService {
  readonly previews = new PlaceholderContainer<IAIChatAttachmentProps>();
  readonly messagePreviews = new PlaceholderContainer<IAIChatMessageAttachmentProps>();

  get accept(): string {
    return Array.from(this.handlers.values())
      .map(handler => handler.accept)
      .filter(Boolean)
      .join(',');
  }

  private readonly handlers = new Map<string, IAIChatAttachmentHandler>();

  constructor(
    private readonly notificationService: NotificationService,
    private readonly aiChatInputService: AIChatInputService,
    private readonly aiChatMessageService: AIChatMessageService,
  ) {}

  register(): void {
    this.aiChatInputService.onDrag.addHandler(data => this.handleInputDrag(data));
    this.aiChatInputService.onValidate.addHandler(data => this.validateInput(data));
    this.aiChatInputService.onPrepareSubmit.addHandler((data, contexts) => this.prepareSubmission(data, contexts));

    this.aiChatMessageService.onMessageSend.addHandler((data, contexts) => this.handleMessageSend(data, contexts));

    this.aiChatInputService.dragPreview.add(AIChatAttachmentsDropPreview);
    this.aiChatInputService.beforeInput.add(AIChatAttachmentsInputContent);
  }

  getState(input: IAIChatInputContext): AIChatAttachmentsState {
    return this.aiChatInputService.getState(input).attachments;
  }

  addHandler(handler: IAIChatAttachmentHandler): void {
    if (this.handlers.has(handler.id)) {
      throw new Error(`AI chat attachment handler is already registered: ${handler.id}`);
    }

    this.handlers.set(handler.id, handler);
    this.previews.add(handler.preview, undefined, ({ attachment }) => attachment.type !== handler.id);

    if (handler.messagePreview) {
      this.messagePreviews.add(handler.messagePreview);
    }
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

    contexts.getContext(aiChatAttachmentsSubmissionContext).submission = { state, attachments };
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
      if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
        return;
      }

      state.setDragOver(false);

      return;
    }

    if (!event.dataTransfer?.types.includes('Files')) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const textarea = input.textareaRef.current;
    const disabled = !textarea || textarea.disabled || textarea.readOnly;

    if (event.type === 'drop') {
      state.setDragOver(false);

      if (!disabled) {
        void this.attachFiles(input, Array.from(event.dataTransfer.files));
        textarea.focus();
      }

      return;
    }

    const acceptedTypes = new Set(
      this.accept
        .split(',')
        .map(type => type.trim())
        .filter(Boolean),
    );

    const canDrop = !disabled && Array.from(event.dataTransfer.items).some(item => item.kind === 'file' && acceptedTypes.has(item.type));

    event.dataTransfer.dropEffect = canDrop ? 'copy' : 'none';
    state.setDragOver(canDrop);
  }

  async attachFiles(input: IAIChatInputContext, files: File[]): Promise<void> {
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
}
