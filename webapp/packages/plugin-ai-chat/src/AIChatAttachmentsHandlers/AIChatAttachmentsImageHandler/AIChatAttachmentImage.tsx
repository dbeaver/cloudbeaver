/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { clsx } from '@dbeaver/ui-kit';

interface Props {
  source: string;
  name: string;
  className?: string;
}

export const AIChatAttachmentImage = observer<Props>(function AIChatAttachmentImage({ source, name, className }) {
  return <img className={clsx('tw:rounded-lg', className)} src={source} alt={name} title={name} decoding="async" loading="lazy" />;
});
