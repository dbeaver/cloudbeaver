/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { DetailsError, type AiChatAttachmentInput } from '@cloudbeaver/core-sdk';
import { blobToBase64, uuid } from '@cloudbeaver/core-utils';

import { AIChatAttachmentsService, type IAIChatAttachment } from '../../AIChatAttachments/AIChatAttachmentsService.js';

const AIChatImageAttachmentImagePreview = importLazyComponent(() =>
  import('./AIChatImageAttachmentImagePreview.js').then(m => m.AIChatImageAttachmentImagePreview),
);

const AIChatImageAttachmentMessagePreview = importLazyComponent(() =>
  import('./AIChatImageAttachmentMessagePreview.js').then(m => m.AIChatImageAttachmentMessagePreview),
);

const IMAGE_ATTACHMENT_TYPE = 'image';
const IMAGE_MEDIA_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);
const MAX_IMAGES = 10;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

export class AIChatAttachmentsImageHandlerServiceImpl {
  constructor(
    private readonly aiChatAttachmentsService: AIChatAttachmentsService,
    private readonly localizationService: LocalizationService,
  ) {}

  register(): void {
    this.aiChatAttachmentsService.addHandler({
      id: IMAGE_ATTACHMENT_TYPE,
      accept: [...IMAGE_MEDIA_TYPES].join(','),
      canHandle: file => IMAGE_MEDIA_TYPES.has(file.type),
      create: file => ({ id: uuid(), type: IMAGE_ATTACHMENT_TYPE, file }),
      validate: attachments => this.validate(attachments),
      serialize: attachment => this.serialize(attachment),
      preview: AIChatImageAttachmentImagePreview,
      messagePreview: AIChatImageAttachmentMessagePreview,
    });
  }

  private validate(attachments: readonly IAIChatAttachment[]): void {
    if (attachments.some(attachment => !IMAGE_MEDIA_TYPES.has(attachment.file.type))) {
      throw new DetailsError(this.localizationService.translate('plugin_ai_chat_attachment_image_format'));
    }

    if (attachments.length > MAX_IMAGES || attachments.reduce((size, attachment) => size + attachment.file.size, 0) > MAX_IMAGE_BYTES) {
      throw new DetailsError(this.localizationService.translate('plugin_ai_chat_attachment_image_limit'));
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

export type AIChatAttachmentsImageHandlerService = AIChatAttachmentsImageHandlerServiceImpl;

export class AIChatAttachmentsImageHandlerServiceDI extends Context.Service<
  AIChatAttachmentsImageHandlerServiceDI,
  AIChatAttachmentsImageHandlerServiceImpl
>()(
  '@cloudbeaver/plugin-ai-chat/AIChatAttachmentsHandlers/AIChatAttachmentsImageHandler/AIChatAttachmentsImageHandlerService#AIChatAttachmentsImageHandlerService',
) {
  static readonly implementation = AIChatAttachmentsImageHandlerServiceImpl;

  static readonly dependencies = () => [AIChatAttachmentsService, LocalizationService] as const;
  static readonly make: Effect.Effect<
    AIChatAttachmentsImageHandlerServiceImpl,
    never,
    Context.Service.Identifier<typeof AIChatAttachmentsService> | Context.Service.Identifier<typeof LocalizationService>
  > = Effect.gen(function* makeAIChatAttachmentsImageHandlerService() {
    const aiChatAttachmentsService = yield* AIChatAttachmentsService;
    const localizationService = yield* LocalizationService;

    return new AIChatAttachmentsImageHandlerServiceImpl(aiChatAttachmentsService, localizationService);
  });
  static readonly layer: Layer.Layer<
    AIChatAttachmentsImageHandlerServiceDI,
    never,
    Context.Service.Identifier<typeof AIChatAttachmentsService> | Context.Service.Identifier<typeof LocalizationService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AIChatAttachmentsImageHandlerService = AIChatAttachmentsImageHandlerServiceDI;
