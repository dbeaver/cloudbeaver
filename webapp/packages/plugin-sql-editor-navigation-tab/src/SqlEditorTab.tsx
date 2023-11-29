/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import styled from 'reshadow';

import { IconOrImage, s, useStyles, useTranslate } from '@cloudbeaver/core-blocks';
import { Connection, ConnectionInfoResource, createConnectionParam } from '@cloudbeaver/core-connections';
import { useDataContext } from '@cloudbeaver/core-data-context';
import { useService } from '@cloudbeaver/core-di';
import { ITabData, Tab, TabIcon, TabTitle } from '@cloudbeaver/core-ui';
import { CaptureViewContext } from '@cloudbeaver/core-view';
import type { TabHandlerTabComponent } from '@cloudbeaver/plugin-navigation-tabs';
import { DATA_CONTEXT_SQL_EDITOR_STATE, getSqlEditorName, ISqlEditorTabState, SqlDataSourceService } from '@cloudbeaver/plugin-sql-editor';

import { DATA_CONTEXT_SQL_EDITOR_TAB } from './DATA_CONTEXT_SQL_EDITOR_TAB';
import sqlEditorTabStyles from './SqlEditorTab.m.css';

export const SqlEditorTab: TabHandlerTabComponent<ISqlEditorTabState> = observer(function SqlEditorTab({ tab, onSelect, onClose, style }) {
  const viewContext = useContext(CaptureViewContext);
  const tabMenuContext = useDataContext(viewContext);
  
  tabMenuContext.set(DATA_CONTEXT_SQL_EDITOR_TAB, true);
  tabMenuContext.set(DATA_CONTEXT_SQL_EDITOR_STATE, tab.handlerState);
  
  const sqlDataSourceService = useService(SqlDataSourceService);
  const connectionInfo = useService(ConnectionInfoResource);
  
  const translate = useTranslate();

  const dataSource = sqlDataSourceService.get(tab.handlerState.editorId);
  let connection: Connection | undefined;
  const executionContext = dataSource?.executionContext;

  if (executionContext) {
    connection = connectionInfo.get(createConnectionParam(executionContext.projectId, executionContext.connectionId));
  }

  const name = getSqlEditorName(tab.handlerState, dataSource, connection);
  const icon = dataSource?.icon ?? '/icons/sql_script_m.svg';
  const saved = dataSource?.isSaved !== false;
  const isReadonly = Boolean(dataSource?.isReadonly());

  const handleSelect = ({ tabId }: ITabData<any>) => onSelect(tabId);
  const handleClose = onClose ? ({ tabId }: ITabData<any>) => onClose(tabId) : undefined;

  return styled(useStyles(style))(
    <Tab tabId={tab.id} style={style} title={name} menuContext={tabMenuContext} onOpen={handleSelect} onClose={handleClose}>
      <TabIcon icon={icon} />
      {isReadonly && <IconOrImage title={translate('data_grid_table_readonly_tooltip')} icon="/icons/lock.png" className={s(sqlEditorTabStyles, { readonlyIcon: true })} />}
      <TabTitle>{name}</TabTitle>
      {!saved && <unsaved-mark className={s(sqlEditorTabStyles, { unsavedMark: true })} />}
    </Tab>,
  );
});
