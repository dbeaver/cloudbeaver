/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import type { TabHandlerTabComponent } from '@cloudbeaver/core-app';
import { TabIcon, Tab, TabTitle, ITabData } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { useStyles } from '@cloudbeaver/core-theming';

import type { ISqlEditorTabState } from './ISqlEditorTabState';

export const SqlEditorTab: TabHandlerTabComponent<ISqlEditorTabState> = observer(function SqlEditorTab({
  tab, onSelect, onClose, style,
}) {
  const connectionInfo = useService(ConnectionInfoResource);
  let name = `sql-${tab.handlerState.order}`;

  if (tab.handlerState.executionContext) {
    const connection = connectionInfo.get(tab.handlerState.executionContext.connectionId);

    if (connection) {
      name = `sql-${tab.handlerState.order} (${connection.name})`;
    }
  }

  const handleSelect = ({ tabId }: ITabData<any>) => onSelect(tabId);
  const handleClose = onClose ? ({ tabId }: ITabData<any>) => onClose(tabId) : undefined;

  return styled(useStyles(style))(
    <Tab tabId={tab.id} style={style} onOpen={handleSelect} onClose={handleClose}>
      <TabIcon icon='/icons/sql_script.png' />
      <TabTitle>{name}</TabTitle>
    </Tab>
  );
});
