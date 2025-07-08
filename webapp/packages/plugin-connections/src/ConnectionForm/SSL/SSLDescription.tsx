/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { IconOrImage, useTranslate } from '@cloudbeaver/core-blocks';
import type { ReactNode } from 'react';

export function SSLDescription(): ReactNode {
  const translate = useTranslate();

  return (
    <>
      <div className="tw:text-balance">{translate('plugin_connections_connection_ssl_description')}</div>
      <div className="tw:flex tw:items-center tw:gap-4 tw:mt-2 tw:text-balance">
        <IconOrImage icon="/icons/info_icon_sm.svg" /> {translate('plugin_connections_connection_ssl_note')}
      </div>
    </>
  );
}
