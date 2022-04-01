/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import styled from 'reshadow';

import type { TabHandlerTabComponent } from '@cloudbeaver/core-app';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { useStyles } from '@cloudbeaver/core-theming';
import { TabIcon, Tab, TabTitle, ITabData } from '@cloudbeaver/core-ui';
import { CaptureViewContext, useDataContext } from '@cloudbeaver/core-view';
import { DATA_CONTEXT_SQL_EDITOR_STATE, getSqlEditorName, ISqlEditorTabState } from '@cloudbeaver/plugin-sql-editor';

import { DATA_CONTEXT_SQL_EDITOR_TAB } from './DATA_CONTEXT_SQL_EDITOR_TAB';

export const SqlEditorTab: TabHandlerTabComponent<ISqlEditorTabState> = observer(function SqlEditorTab({
  tab, onSelect, onClose, style,
}) {
  const viewContext = useContext(CaptureViewContext);
  const tabMenuContext = useDataContext(viewContext);

  tabMenuContext.set(DATA_CONTEXT_SQL_EDITOR_TAB, true);
  tabMenuContext.set(DATA_CONTEXT_SQL_EDITOR_STATE, tab.handlerState);

  const connectionInfo = useService(ConnectionInfoResource);

  const connection = connectionInfo.get(tab.handlerState.executionContext?.connectionId || '');
  const name = getSqlEditorName(tab.handlerState, connection);

  const handleSelect = ({ tabId }: ITabData<any>) => onSelect(tabId);
  const handleClose = onClose ? ({ tabId }: ITabData<any>) => onClose(tabId) : undefined;

  return styled(useStyles(style))(
    <Tab
      tabId={tab.id}
      style={style}
      title={name}
      menuContext={tabMenuContext}
      onOpen={handleSelect}
      onClose={handleClose}
    >
      <TabIcon icon='/icons/sql_script_m.svg' />
      <TabTitle>{name}</TabTitle>
    </Tab>
  );
});
