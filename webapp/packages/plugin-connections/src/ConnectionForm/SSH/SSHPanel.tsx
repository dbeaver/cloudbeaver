/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { SSH_TUNNEL_ID } from '@cloudbeaver/core-connections';
import { TabContainerPanelComponent, useTab } from '@cloudbeaver/core-ui';

import type { IConnectionFormProps } from '../IConnectionFormProps';
import { SSH } from './SSH';

export const SSHPanel: TabContainerPanelComponent<IConnectionFormProps> = observer(function SSHPanel(props) {
  const state = props.state.config.networkHandlersConfig?.find(state => state.id === SSH_TUNNEL_ID);
  const tab = useTab(props.tabId);

  if (!state || !tab.selected) {
    return null;
  }

  return <SSH {...props} handlerState={state} />;
});
