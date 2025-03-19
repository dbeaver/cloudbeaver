/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Translate, useResource } from '@cloudbeaver/core-blocks';
import { DBDriverResource, NetworkHandlerResource } from '@cloudbeaver/core-connections';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { Tab, type TabContainerTabComponent, TabTitle, useTab } from '@cloudbeaver/core-ui';

import { getSSLDriverHandler } from './getSSLDriverHandler.js';
import type { IConnectionFormProps } from '../IConnectionFormState.js';
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';

export const SSLTab: TabContainerTabComponent<IConnectionFormProps> = observer(function SSLTab(props) {
  const { selected } = useTab(props.tabId);
  const networkHandlerResource = useResource(SSLTab, NetworkHandlerResource, CachedMapAllKey, {
    active: selected,
  });
  const optionsPart = getConnectionFormOptionsPart(props.formState);
  const dbDriverResource = useResource(SSLTab, DBDriverResource, optionsPart.state.driverId ?? null);

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
