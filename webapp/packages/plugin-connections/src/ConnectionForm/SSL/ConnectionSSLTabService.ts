/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { DBDriverResource, NetworkHandlerResource } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';
import { getSSLDriverHandler } from './getSSLDriverHandler.js';
import { ConnectionFormService } from '../ConnectionFormService.js';
import { CachedMapAllKey, getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';

const SSLTab = React.lazy(async () => {
  const { SSLTab } = await import('./SSLTab.js');
  return { default: SSLTab };
});
const SSLPanel = React.lazy(async () => {
  const { SSLPanel } = await import('./SSLPanel.js');
  return { default: SSLPanel };
});

@injectable()
export class ConnectionSSLTabService extends Bootstrap {
  constructor(
    private readonly dbDriverResource: DBDriverResource,
    private readonly networkHandlerResource: NetworkHandlerResource,
    private readonly connectionFormService: ConnectionFormService,
  ) {
    super();
  }

  override register(): void {
    this.connectionFormService.parts.add({
      key: 'ssl',
      order: 4,
      tab: () => SSLTab,
      panel: () => SSLPanel,
      getLoader: () => [
        getCachedMapResourceLoaderState(this.dbDriverResource, () => CachedMapAllKey),
        getCachedMapResourceLoaderState(this.networkHandlerResource, () => CachedMapAllKey),
      ],
      isHidden: (_, props) => {
        const optionsPart = props?.formState ? getConnectionFormOptionsPart(props.formState) : null;

        if (optionsPart?.state.driverId) {
          const driver = this.dbDriverResource.get(optionsPart.state.driverId);
          const handler = getSSLDriverHandler(this.networkHandlerResource.values, driver?.applicableNetworkHandlers ?? []);
          return !handler;
        }

        return true;
      },
    });
  }
}
