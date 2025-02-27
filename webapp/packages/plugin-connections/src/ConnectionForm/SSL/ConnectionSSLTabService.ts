/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { DBDriverResource, NetworkHandlerResource } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { getSSLDriverHandler } from './getSSLDriverHandler.js';
import { ConnectionFormServiceRefactored } from '../ConnectionFormServiceRefactored.js';

export const SSLTab = React.lazy(async () => {
  const { SSLTab } = await import('./SSLTab.js');
  return { default: SSLTab };
});
export const SSLPanel = React.lazy(async () => {
  const { SSLPanel } = await import('./SSLPanel.js');
  return { default: SSLPanel };
});

@injectable()
export class ConnectionSSLTabService extends Bootstrap {
  constructor(
    private readonly dbDriverResource: DBDriverResource,
    private readonly networkHandlerResource: NetworkHandlerResource,
    private readonly connectionFormServiceRefactored: ConnectionFormServiceRefactored,
  ) {
    super();
  }

  override register(): void {
    this.connectionFormServiceRefactored.parts.add({
      key: 'ssl',
      order: 4,
      tab: () => SSLTab,
      panel: () => SSLPanel,
      isHidden: (_, props) => {
        if (props?.formState.state.config.driverId) {
          const driver = this.dbDriverResource.get(props?.formState.state.config.driverId);
          const handler = getSSLDriverHandler(this.networkHandlerResource.values, driver?.applicableNetworkHandlers ?? []);
          return !handler;
        }

        return true;
      },
    });
  }
}
