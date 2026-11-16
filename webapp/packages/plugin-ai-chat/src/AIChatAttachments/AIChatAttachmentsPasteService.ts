/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { AIChatInputService, type IAIChatInputPasteEvent } from '../AIChat/AIChatInput/AIChatInputService.js';
import { AIChatAttachmentsService } from './AIChatAttachmentsService.js';

export class AIChatAttachmentsPasteServiceImpl {
  constructor(
    private readonly aiChatInputService: AIChatInputService,
    private readonly aiChatAttachmentsService: AIChatAttachmentsService,
  ) {}

  register(): void {
    this.aiChatInputService.onPaste.addHandler(data => this.handleInputPaste(data));
  }

  private handleInputPaste({ input, event }: IAIChatInputPasteEvent): void {
    if (event.defaultPrevented || event.currentTarget.disabled || event.currentTarget.readOnly) {
      return;
    }

    const files = Array.from(event.clipboardData.files).filter(file => this.aiChatAttachmentsService.getHandler(file));

    if (files.length === 0) {
      return;
    }

    if (!event.clipboardData.getData('text/plain')) {
      event.preventDefault();
    }

    void this.aiChatAttachmentsService.attachFiles(input, files);
  }
}

export type AIChatAttachmentsPasteService = AIChatAttachmentsPasteServiceImpl;

export class AIChatAttachmentsPasteServiceDI extends Context.Service<AIChatAttachmentsPasteServiceDI, AIChatAttachmentsPasteServiceImpl>()(
  '@cloudbeaver/plugin-ai-chat/AIChatAttachments/AIChatAttachmentsPasteService#AIChatAttachmentsPasteService',
) {
  static readonly implementation = AIChatAttachmentsPasteServiceImpl;

  static readonly dependencies = () => [AIChatInputService, AIChatAttachmentsService] as const;
  static readonly make: Effect.Effect<
    AIChatAttachmentsPasteServiceImpl,
    never,
    Context.Service.Identifier<typeof AIChatInputService> | Context.Service.Identifier<typeof AIChatAttachmentsService>
  > = Effect.gen(function* makeAIChatAttachmentsPasteService() {
    const aiChatInputService = yield* AIChatInputService;
    const aiChatAttachmentsService = yield* AIChatAttachmentsService;

    return new AIChatAttachmentsPasteServiceImpl(aiChatInputService, aiChatAttachmentsService);
  });
  static readonly layer: Layer.Layer<
    AIChatAttachmentsPasteServiceDI,
    never,
    Context.Service.Identifier<typeof AIChatInputService> | Context.Service.Identifier<typeof AIChatAttachmentsService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AIChatAttachmentsPasteService = AIChatAttachmentsPasteServiceDI;
