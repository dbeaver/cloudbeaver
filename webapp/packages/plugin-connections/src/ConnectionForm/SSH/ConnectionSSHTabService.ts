/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { DBDriverResource, SSH_TUNNEL_ID } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { DriverConfigurationType } from '@cloudbeaver/core-sdk';

import { ConnectionFormServiceRefactored } from '../ConnectionFormServiceRefactored.js';
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';

export const SSHTab = React.lazy(async () => {
  const { SSHTab } = await import('./SSHTab.js');
  return { default: SSHTab };
});
export const SSHPanel = React.lazy(async () => {
  const { SSHPanel } = await import('./SSHPanel.js');
  return { default: SSHPanel };
});

@injectable()
export class ConnectionSSHTabService extends Bootstrap {
  constructor(
    private readonly dbDriverResource: DBDriverResource,
    private readonly connectionFormServiceRefactored: ConnectionFormServiceRefactored,
  ) {
    super();
  }

  override register(): void {
    this.connectionFormServiceRefactored.parts.add({
      key: 'ssh',
      name: 'plugin_connections_connection_form_part_main',
      order: 3,
      tab: () => SSHTab,
      panel: () => SSHPanel,
      isHidden: (tabId, props) => {
        if (props?.formState.state.config.driverId) {
          const driver = this.dbDriverResource.get(props?.formState.state.config.driverId);
          const optionsPart = getConnectionFormOptionsPart(props.formState);
          const urlType = optionsPart.state.configurationType === DriverConfigurationType.Url;

          return urlType || !driver?.applicableNetworkHandlers.includes(SSH_TUNNEL_ID);
        }

        return true;
      },
    });
  }
}
