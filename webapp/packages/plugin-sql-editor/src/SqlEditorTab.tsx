/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled from 'reshadow';

import { TabHandlerTabProps } from '@cloudbeaver/core-app';
import { TabIcon, Tab, TabTitle } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { useStyles } from '@cloudbeaver/core-theming';

import { ISqlEditorTabState } from './ISqlEditorTabState';

export const SqlEditorTab = observer(function SqlEditorTab({
  tab, handler, onSelect, onClose, style,
}: TabHandlerTabProps<ISqlEditorTabState>) {
  const connectionInfo = useService(ConnectionInfoResource);
  const connection = connectionInfo.get(tab.handlerState.connectionId);
  const name = `sql-${tab.handlerState.order}${connection ? ` (${connection.name})` : ''}`;

  return styled(useStyles(style))(
    <Tab tabId={tab.id} onOpen={onSelect} onClose={onClose} style={style}>
      <TabIcon icon='/icons/sql_script.png' />
      <TabTitle>{name}</TabTitle>
    </Tab>
  );
});
