/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { useResource } from '@cloudbeaver/core-blocks';
import { DBDriverResource, NetworkHandlerResource } from '@cloudbeaver/core-connections';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';
import { TabContainerTabComponent, useTab } from '@cloudbeaver/core-ui';

import type { IConnectionFormProps } from '../IConnectionFormProps';
import { getDefaultConfig } from './getDefaultConfig';
import { getSSLDriverHandler } from './getSSLDriverHandler';
import { SSL } from './SSL';

export const SSLPanel: TabContainerTabComponent<IConnectionFormProps> = observer(function SSLPanel(props) {
  const tab = useTab(props.tabId);
  const networkHandlerResource = useResource(SSLPanel, NetworkHandlerResource, CachedMapAllKey);
  const dbDriverResource = useResource(SSLPanel, DBDriverResource, props.state.config.driverId ?? null);

  const handler = getSSLDriverHandler(networkHandlerResource.resource.values, dbDriverResource.data?.applicableNetworkHandlers ?? []);

  if (handler && !props.state.config.networkHandlersConfig?.some(state => state.id === handler?.id)) {
    props.state.config.networkHandlersConfig?.push({
      id: handler.id,
      ...getDefaultConfig(),
    });
  }


  const handlerState = props.state.config.networkHandlersConfig?.find(h => h.id === handler?.id);

  if (!handler || !handlerState || !tab.selected) {
    return null;
  }

  return <SSL {...props} handler={handler} handlerState={handlerState} />;
});
