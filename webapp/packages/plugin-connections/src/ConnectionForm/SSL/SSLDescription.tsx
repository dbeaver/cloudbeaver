/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { IconOrImage, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { ProductInfoResource } from '@cloudbeaver/core-root';
import type { ReactNode } from 'react';

export function SSLDescription(): ReactNode {
  const translate = useTranslate();
  const productInfoResource = useResource(SSLDescription, ProductInfoResource, undefined);
  const productName = productInfoResource.data?.name || 'CloudBeaver';

  return (
    <>
      <div>{translate('plugin_connections_connection_ssl_optional')}</div>
      <div className="tw:text-balance">{translate('plugin_connections_connection_ssl_description')}</div>
      <div className="tw:flex tw:items-center tw:gap-4 tw:mt-2 tw:text-balance">
        <IconOrImage icon="/icons/info_icon_sm.svg" /> {translate('plugin_connections_connection_ssl_note', undefined, { productName })}
      </div>
    </>
  );
}
