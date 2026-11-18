/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { useTranslate } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, createConnectionParam } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { type ITabData, Tab, TabIcon, TabTitle } from '@cloudbeaver/core-ui';
import type { TabHandlerTabComponent } from '@cloudbeaver/plugin-navigation-tabs';

import { getDBAdminManagerIcon, getDBAdminManagerTitle } from '../getDBAdminManagerInfo.js';
import type { IDBAdminTabState } from './IDBAdminTabState.js';

export const DBAdminNavigationTab: TabHandlerTabComponent<IDBAdminTabState> = observer(function DBAdminNavigationTab({ tab, onSelect, onClose }) {
  const translate = useTranslate();
  const connectionInfoResource = useService(ConnectionInfoResource);
  const { projectId, connectionId, manager } = tab.handlerState;
  const connection = connectionInfoResource.get(createConnectionParam(projectId, connectionId));
  const managerTitle = translate(getDBAdminManagerTitle(manager));
  const title = connection?.name ? `${managerTitle} - ${connection.name}` : managerTitle;

  function handleSelect({ tabId }: ITabData<any>) {
    return onSelect(tabId);
  }

  const handleClose = onClose ? ({ tabId }: ITabData<any>) => onClose(tabId) : undefined;

  return (
    <Tab tabId={tab.id} title={title} onOpen={handleSelect} onClose={handleClose}>
      <TabIcon icon={getDBAdminManagerIcon(manager)} />
      <TabTitle>{title}</TabTitle>
    </Tab>
  );
});
