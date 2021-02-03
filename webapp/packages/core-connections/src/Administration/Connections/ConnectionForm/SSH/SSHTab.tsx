/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { TabTitle, Tab, TabContainerTabComponent, useMapResource } from '@cloudbeaver/core-blocks';
import { Translate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { NetworkHandlerResource } from '../../../../NetworkHandlerResource';
import type { IConnectionFormProps } from '../ConnectionFormService';

export const SSHTab: TabContainerTabComponent<IConnectionFormProps> = observer(function SSHTab({
  model,
  controller,
  style,
  ...rest
}) {
  const styles = useStyles(style);
  const handler = useMapResource(NetworkHandlerResource, 'ssh_tunnel');

  return styled(styles)(
    <Tab {...rest} style={style}>
      <TabTitle><Translate token={handler.data?.label || 'connections_network_handler_ssh_tunnel_title'} /></TabTitle>
    </Tab>
  );
});
