/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { useResource } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, createConnectionParam } from '@cloudbeaver/core-connections';
import type { TabHandlerPanelComponent } from '@cloudbeaver/plugin-navigation-tabs';

import { LockManager } from '../LockManager/LockManager.js';
import { SessionManager } from '../SessionManager/SessionManager.js';
import type { IDBAdminTabState } from './IDBAdminTabState.js';

export const DBAdminNavigationPanel: TabHandlerPanelComponent<IDBAdminTabState> = observer(function DBAdminNavigationPanel({ tab }) {
  const { projectId, connectionId, manager } = tab.handlerState;
  const connectionKey = createConnectionParam(projectId, connectionId);
  const connectionLoader = useResource(DBAdminNavigationPanel, ConnectionInfoResource, connectionKey);
  const connection = connectionLoader.data?.connected ? connectionKey : null;

  if (manager === 'locks') {
    return <LockManager connection={connection} />;
  }

  return <SessionManager connection={connection} />;
});
