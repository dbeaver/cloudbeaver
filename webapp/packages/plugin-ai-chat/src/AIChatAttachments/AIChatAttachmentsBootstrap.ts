/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { AIChatInputService } from '../AIChat/AIChatInput/AIChatInputService.js';
import { AIChatMessageService } from '../AIChat/AIChatMessage/AIChatMessageService.js';
import { AIChatAttachmentsService } from './AIChatAttachmentsService.js';

const AIChatAttachmentsDropPreview = importLazyComponent(() => import('./AIChatAttachmentsDropPreview.js').then(m => m.AIChatAttachmentsDropPreview));
const AIChatAttachmentsInputContent = importLazyComponent(() =>
  import('./AIChatAttachmentsInputContent.js').then(m => m.AIChatAttachmentsInputContent),
);

@injectable(() => [AIChatInputService, AIChatAttachmentsService, AIChatMessageService])
export class AIChatAttachmentsBootstrap extends Bootstrap {
  constructor(
    private readonly aiChatInputService: AIChatInputService,
    private readonly aiChatAttachmentsService: AIChatAttachmentsService,
    private readonly aiChatMessageService: AIChatMessageService,
  ) {
    super();
  }

  override register(): void {
    this.aiChatInputService.onDrag.addHandler(data => this.aiChatAttachmentsService.handleInputDrag(data));
    this.aiChatInputService.onValidate.addHandler(data => this.aiChatAttachmentsService.validateInput(data));
    this.aiChatInputService.onPrepareSubmit.addHandler((data, contexts) => this.aiChatAttachmentsService.prepareSubmission(data, contexts));
    this.aiChatMessageService.onMessageSend.addHandler((data, contexts) => this.aiChatAttachmentsService.handleMessageSend(data, contexts));
    this.aiChatInputService.dragPreview.add(AIChatAttachmentsDropPreview);
    this.aiChatInputService.beforeInput.add(AIChatAttachmentsInputContent);
  }
}
