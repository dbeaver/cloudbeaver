/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';

import type { IAIChatAttachmentProps } from '../../AIChatAttachments/AIChatAttachmentsService.js';

export const AIChatImageAttachmentImagePreview = observer<IAIChatAttachmentProps>(function AIChatImageAttachmentImagePreview({ attachment }) {
  const [source, setSource] = useState<string>();
  const file = attachment.file;

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSource(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!source) {
    return null;
  }

  return <img className="tw:size-16 tw:rounded-md tw:object-contain" src={source} alt={file.name} title={file.name} decoding="async" />;
});
