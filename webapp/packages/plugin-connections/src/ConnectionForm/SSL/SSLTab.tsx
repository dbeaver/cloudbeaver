/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { Translate, useResource, useStyles } from '@cloudbeaver/core-blocks';
import { DBDriverResource, NetworkHandlerResource } from '@cloudbeaver/core-connections';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';
import { Tab, TabContainerTabComponent, TabTitle } from '@cloudbeaver/core-ui';

import type { IConnectionFormProps } from '../IConnectionFormProps';
import { SSL_CODE_NAME } from './SSL_CODE_NAME';

export const SSLTab: TabContainerTabComponent<IConnectionFormProps> = observer(function SSLTab({ style, ...rest }) {
  const styles = useStyles(style);
  const networkHandlerResource = useResource(SSLTab, NetworkHandlerResource, CachedMapAllKey);
  const dbDriverResource = useResource(SSLTab, DBDriverResource, rest.state.config.driverId ?? null);

  const handler = networkHandlerResource.resource.values.find(
    handler => dbDriverResource.data?.applicableNetworkHandlers.includes(handler.id) && handler.codeName === SSL_CODE_NAME,
  );

  if (!handler) {
    return null;
  }

  return styled(styles)(
    <Tab {...rest} title={handler.description} style={style}>
      <TabTitle>
        <Translate token={handler.label ?? ''} />
      </TabTitle>
    </Tab>,
  );
});
