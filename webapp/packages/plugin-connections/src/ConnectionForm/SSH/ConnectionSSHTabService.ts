/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { DBDriverResource, SSH_TUNNEL_ID } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { DriverConfigurationType } from '@cloudbeaver/core-sdk';

import { ConnectionFormService } from '../ConnectionFormService.js';
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';
import { getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';

const SSHTab = React.lazy(async () => {
  const { SSHTab } = await import('./SSHTab.js');
  return { default: SSHTab };
});
const SSHPanel = React.lazy(async () => {
  const { SSHPanel } = await import('./SSHPanel.js');
  return { default: SSHPanel };
});

@injectable()
export class ConnectionSSHTabService extends Bootstrap {
  constructor(
    private readonly dbDriverResource: DBDriverResource,
    private readonly connectionFormService: ConnectionFormService,
  ) {
    super();
  }

  override register(): void {
    this.connectionFormService.parts.add({
      key: 'ssh',
      name: 'plugin_connections_connection_form_part_main',
      order: 3,
      tab: () => SSHTab,
      panel: () => SSHPanel,
      getLoader: (_, props) => {
        const optionsPart = props?.formState ? getConnectionFormOptionsPart(props.formState) : null;
        return [getCachedMapResourceLoaderState(this.dbDriverResource, () => optionsPart?.state.driverId ?? null)];
      },
      isHidden: (tabId, props) => {
        const optionsPart = props?.formState ? getConnectionFormOptionsPart(props.formState) : null;

        if (optionsPart?.state.driverId) {
          const driver = this.dbDriverResource.get(optionsPart.state.driverId);
          const urlType = optionsPart.state.configurationType === DriverConfigurationType.Url;

          return urlType || !driver?.applicableNetworkHandlers.includes(SSH_TUNNEL_ID);
        }

        return true;
      },
    });
  }
}
