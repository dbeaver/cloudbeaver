/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { useAutoLoad, useResource } from '@cloudbeaver/core-blocks';
import { DBDriverResource, NetworkHandlerResource } from '@cloudbeaver/core-connections';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import type { TabContainerTabComponent } from '@cloudbeaver/core-ui';

import { getSSLDriverHandler } from './getSSLDriverHandler.js';
import { SSL } from './SSL.js';
import { getConnectionFormSSLPart } from './getConnectionFormSSLPart.js';
import type { IConnectionFormProps } from '../IConnectionFormState.js';
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';

export const SSLPanel: TabContainerTabComponent<IConnectionFormProps> = observer(function SSLPanel(props) {
  const networkHandlerResource = useResource(SSLPanel, NetworkHandlerResource, CachedMapAllKey);
  const optionsPart = getConnectionFormOptionsPart(props.formState);
  const dbDriverResource = useResource(SSLPanel, DBDriverResource, optionsPart.state.driverId ?? null);

  const handler = getSSLDriverHandler(networkHandlerResource.resource.values, dbDriverResource.data?.applicableNetworkHandlers ?? []);
  const sslPart = getConnectionFormSSLPart(props.formState);

  useAutoLoad(SSLPanel, sslPart);

  if (!handler || !sslPart.state) {
    return null;
  }

  return <SSL {...props} handler={handler} handlerState={sslPart.state} />;
});
