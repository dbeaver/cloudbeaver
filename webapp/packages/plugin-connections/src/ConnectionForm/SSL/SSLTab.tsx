/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Translate, useResource } from '@cloudbeaver/core-blocks';
import { DBDriverResource, NetworkHandlerResource } from '@cloudbeaver/core-connections';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { Tab, type TabContainerTabComponent, TabTitle } from '@cloudbeaver/core-ui';

import type { IConnectionFormProps } from '../IConnectionFormProps.js';
import { getSSLDriverHandler } from './getSSLDriverHandler.js';

export const SSLTab: TabContainerTabComponent<IConnectionFormProps> = observer(function SSLTab(props) {
  const networkHandlerResource = useResource(SSLTab, NetworkHandlerResource, CachedMapAllKey);
  const dbDriverResource = useResource(SSLTab, DBDriverResource, props.state.config.driverId ?? null);

  const handler = getSSLDriverHandler(networkHandlerResource.resource.values, dbDriverResource.data?.applicableNetworkHandlers ?? []);

  if (!handler) {
    return null;
  }

  return (
    <Tab {...props} title={handler.description}>
      <TabTitle>
        <Translate token={handler.label} />
      </TabTitle>
    </Tab>
  );
});
