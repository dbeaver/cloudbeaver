/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Translate, useResource } from '@cloudbeaver/core-blocks';
import { NetworkHandlerResource, SSH_TUNNEL_ID } from '@cloudbeaver/plugin-network-handlers';
import { Tab, type TabContainerTabComponent, TabTitle, useTab } from '@cloudbeaver/core-ui';
import type { IConnectionFormProps } from '@cloudbeaver/plugin-connections';

export const SSHTab: TabContainerTabComponent<IConnectionFormProps> = observer(function SSHTab(props) {
  const { selected } = useTab(props.tabId);
  const handler = useResource(SSHTab, NetworkHandlerResource, SSH_TUNNEL_ID, {
    active: selected,
  });

  return (
    <Tab {...props} title={handler.data?.description}>
      <TabTitle>
        <Translate token={handler.data?.label || 'plugin_connection_network_handlers_ssh_tunnel_title'} />
      </TabTitle>
    </Tab>
  );
});
