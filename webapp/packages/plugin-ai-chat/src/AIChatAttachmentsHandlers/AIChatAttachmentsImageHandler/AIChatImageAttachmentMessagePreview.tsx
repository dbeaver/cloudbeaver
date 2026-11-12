/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import type { IAIChatMessageAttachmentProps } from '../../AIChatAttachments/AIChatAttachmentsService.js';
import { AIChatAttachmentImage } from './AIChatAttachmentImage.js';

export const AIChatImageAttachmentMessagePreview = observer<IAIChatMessageAttachmentProps>(function AIChatImageAttachmentMessagePreview({
  attachment,
}) {
  const image = attachment.image;

  if (!image) {
    return null;
  }

  return (
    <AIChatAttachmentImage
      source={`data:${image.mediaType};base64,${image.data}`}
      name={image.name}
      className="tw:h-28 tw:w-40 tw:max-w-full tw:object-cover tw:border tw:border-(--theme-background)"
    />
  );
});
