/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { blobToBase64, uuid } from '@cloudbeaver/core-utils';
import { LocalizationService } from '@cloudbeaver/core-localization';
import type { AiChatAttachmentInput } from '@cloudbeaver/core-sdk';

import { AIChatAttachmentsService, type IAIChatAttachment } from '../../AIChatAttachments/AIChatAttachmentsService.js';

const AIChatImageAttachmentImagePreview = importLazyComponent(() =>
  import('./AIChatImageAttachmentImagePreview.js').then(m => m.AIChatImageAttachmentImagePreview),
);

const IMAGE_ATTACHMENT_TYPE = 'image';
const IMAGE_MEDIA_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);
const MAX_IMAGES = 10;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

@injectable(() => [AIChatAttachmentsService, LocalizationService])
export class AIChatAttachmentsImageHandlerService extends Bootstrap {
  constructor(
    private readonly aiChatAttachmentsService: AIChatAttachmentsService,
    private readonly localizationService: LocalizationService,
  ) {
    super();
  }

  override register(): void {
    this.aiChatAttachmentsService.register({
      id: IMAGE_ATTACHMENT_TYPE,
      canHandle: file => IMAGE_MEDIA_TYPES.has(file.type),
      create: file => ({ id: uuid(), type: IMAGE_ATTACHMENT_TYPE, file }),
      validate: attachments => this.validate(attachments),
      serialize: attachment => this.serialize(attachment),
      preview: AIChatImageAttachmentImagePreview,
    });
  }

  private validate(attachments: readonly IAIChatAttachment[]): void {
    if (attachments.some(attachment => !IMAGE_MEDIA_TYPES.has(attachment.file.type))) {
      throw new Error(this.localizationService.translate('plugin_ai_chat_attachment_image_format'));
    }

    if (attachments.length > MAX_IMAGES || attachments.reduce((size, attachment) => size + attachment.file.size, 0) > MAX_IMAGE_BYTES) {
      throw new Error(this.localizationService.translate('plugin_ai_chat_attachment_image_limit'));
    }
  }

  private async serialize(attachment: IAIChatAttachment): Promise<AiChatAttachmentInput> {
    const source = await blobToBase64(attachment.file);
    const separator = source?.indexOf(',') ?? -1;

    if (!source || separator === -1) {
      throw new Error(this.localizationService.translate('plugin_ai_chat_attachment_read_error'));
    }

    return {
      image: {
        name: attachment.file.name,
        mediaType: attachment.file.type,
        data: source.slice(separator + 1),
      },
    };
  }
}
