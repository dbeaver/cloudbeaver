/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { type PropsWithChildren } from 'react';

import { Button, getComputed, Loader, TextPlaceholder, useResource, useTranslate } from '@cloudbeaver/core-blocks';
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
  const connecting = getComputed(() => (connectionKey && connection.resource.isConnecting(connectionKey)) || connection.loading);
  const isConnectionReady = getComputed(() => !connecting && connection.data?.connected && connection.loaded && !connection.outdated);

  async function handleConnect() {
    if (isConnectionReady || !connection.data || !connectionKey) {
      return;
    }

    try {
      await connectionsManagerService.requireConnection(connectionKey);
    } catch (exception: any) {
      notificationService.logException(exception);
    }
  }

  if (connecting) {
    return <Loader message="ui_processing_connecting" />;
  }

  if (!isConnectionReady) {
    return (
      <TextPlaceholder>
        <Button type="button" onClick={handleConnect}>
          {translate('connections_connection_connect')}
        </Button>
      </TextPlaceholder>
    );
  }

  return children;
});
