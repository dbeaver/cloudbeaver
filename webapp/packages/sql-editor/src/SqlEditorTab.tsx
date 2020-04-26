/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled from 'reshadow';

import { TabHandlerTabProps, ConnectionsManagerService } from '@dbeaver/core/app';
import { TabIcon, Tab, TabTitle } from '@dbeaver/core/blocks';
import { useService } from '@dbeaver/core/di';
import { useStyles } from '@dbeaver/core/theming';

import { ISqlEditorTabState } from './ISqlEditorTabState';

export function SqlEditorTab({
  tab, handler, onSelect, onClose, style,
}: TabHandlerTabProps<ISqlEditorTabState>) {
  const connectionsManagerService = useService(ConnectionsManagerService);
  const connection = connectionsManagerService.getConnectionById(tab.handlerState.connectionId);
  const name = `sql-${tab.handlerState.order}${connection ? ` (${connection.name})` : ''}`;

  return styled(useStyles(...style))(
    <Tab tabId={tab.id} onOpen={onSelect} onClose={onClose} >
      <TabIcon icon='/icons/sql_script.png' />
      <TabTitle title={name} />
    </Tab>
  );
}
