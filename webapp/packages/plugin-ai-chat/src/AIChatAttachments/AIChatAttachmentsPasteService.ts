/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';

import { AIChatInputService, type IAIChatInputPasteEvent } from '../AIChat/AIChatInput/AIChatInputService.js';
import { AIChatAttachmentsService } from './AIChatAttachmentsService.js';

@injectable(() => [AIChatInputService, AIChatAttachmentsService])
export class AIChatAttachmentsPasteService {
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
