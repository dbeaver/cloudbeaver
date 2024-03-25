/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { type PropsWithChildren, useState } from 'react';

import { Button, Loader, TextPlaceholder, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, ConnectionsManagerService, type IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';

export interface IConnectionShieldProps {
  connectionKey: IConnectionInfoParams | null;
}

export const ConnectionShield = observer<PropsWithChildren<IConnectionShieldProps>>(function ConnectionShield({ connectionKey, children }) {
  const translate = useTranslate();
  const connectionsManagerService = useService(ConnectionsManagerService);
  const notificationService = useService(NotificationService);

  const connection = useResource(ConnectionShield, ConnectionInfoResource, connectionKey);

  const [connecting, setConnecting] = useState(false);

  async function handleConnect() {
    if (connecting || !connection.data || !connectionKey) {
      return;
    }

    setConnecting(true);

    try {
      await connectionsManagerService.requireConnection(connectionKey);
    } catch (exception: any) {
      notificationService.logException(exception);
    } finally {
      setConnecting(false);
    }
  }

  if (connection.data && !connection.data.connected) {
    if (connecting || connection.isLoading()) {
      return <Loader />;
    }

    return (
      <TextPlaceholder>
        <Button type="button" mod={['unelevated']} onClick={handleConnect}>
          {translate('connections_connection_connect')}
        </Button>
      </TextPlaceholder>
    );
  }

  return children;
});
