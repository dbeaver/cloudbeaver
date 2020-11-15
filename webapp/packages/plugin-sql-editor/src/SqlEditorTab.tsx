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
import { TabIcon, Tab, TabTitle, ITabData } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { useStyles } from '@cloudbeaver/core-theming';

import { ISqlEditorTabState } from './ISqlEditorTabState';

export const SqlEditorTab = observer(function SqlEditorTab({
  tab, onSelect, onClose, style,
}: TabHandlerTabProps<ISqlEditorTabState>) {
  const connectionInfo = useService(ConnectionInfoResource);
  let name = `sql-${tab.handlerState.order}`;
  if (tab.handlerState.connectionId) {
    const connection = connectionInfo.get(tab.handlerState.connectionId);
    name = `sql-${tab.handlerState.order}${connection ? ` (${connection.name})` : ''}`;
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
