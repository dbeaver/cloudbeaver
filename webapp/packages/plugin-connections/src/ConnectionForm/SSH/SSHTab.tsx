/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Translate, useResource } from '@cloudbeaver/core-blocks';
import { NetworkHandlerResource, SSH_TUNNEL_ID } from '@cloudbeaver/core-connections';
import { Tab, type TabContainerTabComponent, TabTitle } from '@cloudbeaver/core-ui';

import type { IConnectionFormProps } from '../IConnectionFormProps.js';

export const SSHTab: TabContainerTabComponent<IConnectionFormProps> = observer(function SSHTab(props) {
  const handler = useResource(SSHTab, NetworkHandlerResource, SSH_TUNNEL_ID);

  return (
    <Tab {...props} title={handler.data?.description}>
      <TabTitle>
        <Translate token={handler.data?.label || 'connections_network_handler_ssh_tunnel_title'} />
      </TabTitle>
    </Tab>
  );
});
