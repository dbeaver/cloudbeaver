/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { useAutoLoad, useResource } from '@cloudbeaver/core-blocks';
import { DBDriverResource, NetworkHandlerResource } from '@cloudbeaver/core-connections';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import type { TabContainerTabComponent } from '@cloudbeaver/core-ui';

import { getSSLDefaultConfig } from './getSSLDefaultConfig.js';
import { getSSLDriverHandler } from './getSSLDriverHandler.js';
import { SSL } from './SSL.js';
import type { ConnectionFormRefactoredProps } from '../ConnectionFormServiceRefactored.js';
import { getConnectionFormSSLPart } from './getConnectionFormSSLPart.js';

export const SSLPanel: TabContainerTabComponent<ConnectionFormRefactoredProps> = observer(function SSLPanel(props) {
  const networkHandlerResource = useResource(SSLPanel, NetworkHandlerResource, CachedMapAllKey);
  const dbDriverResource = useResource(SSLPanel, DBDriverResource, props.formState.state.config.driverId ?? null);
  const SSLPart = getConnectionFormSSLPart(props.formState);

  const handler = getSSLDriverHandler(networkHandlerResource.resource.values, dbDriverResource.data?.applicableNetworkHandlers ?? []);

  if (SSLPart.isLoaded() && handler && !props.formState.state.config.networkHandlersConfig?.some(state => state.id === handler?.id)) {
    props.formState.state.config.networkHandlersConfig?.push(getSSLDefaultConfig(handler.id));
  }

  const handlerState = props.formState.state.config.networkHandlersConfig?.find(h => h.id === handler?.id);

  useAutoLoad(SSLPanel, [SSLPart]);

  if (!handler || !handlerState) {
    return null;
  }

  return (
    <SSL
      {...props}
      sharedCredentials={Boolean(props.formState.state.config.sharedCredentials)}
      template={Boolean(props.formState.state.config.template)}
      handler={handler}
      handlerState={handlerState}
    />
  );
});
