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

import { useStyles } from '@cloudbeaver/core-blocks';
import { Connection, ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { TabIcon, Tab, TabTitle, ITabData } from '@cloudbeaver/core-ui';
import { CaptureViewContext, useDataContext } from '@cloudbeaver/core-view';
import type { TabHandlerTabComponent } from '@cloudbeaver/plugin-navigation-tabs';
import { DATA_CONTEXT_SQL_EDITOR_STATE, getSqlEditorName, ISqlEditorTabState, SqlDataSourceService } from '@cloudbeaver/plugin-sql-editor';

import { DATA_CONTEXT_SQL_EDITOR_TAB } from './DATA_CONTEXT_SQL_EDITOR_TAB';

export const SqlEditorTab: TabHandlerTabComponent<ISqlEditorTabState> = observer(function SqlEditorTab({
  tab, onSelect, onClose, style,
}) {
  const viewContext = useContext(CaptureViewContext);
  const tabMenuContext = useDataContext(viewContext);

  tabMenuContext.set(DATA_CONTEXT_SQL_EDITOR_TAB, true);
  tabMenuContext.set(DATA_CONTEXT_SQL_EDITOR_STATE, tab.handlerState);

  const sqlDataSourceService = useService(SqlDataSourceService);
  const connectionInfo = useService(ConnectionInfoResource);

  const dataSource = sqlDataSourceService.get(tab.handlerState.editorId);
  let connection: Connection | undefined;

  if (dataSource?.executionContext) {
    connection = connectionInfo.get({
      projectId: dataSource.executionContext.projectId,
      connectionId: dataSource.executionContext.connectionId,
    });
  }

  const name = getSqlEditorName(tab.handlerState, dataSource, connection);

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
