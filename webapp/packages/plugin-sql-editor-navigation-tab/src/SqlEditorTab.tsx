/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { IconOrImage, s, useObjectInfoTooltip, useTranslate } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, createConnectionParam } from '@cloudbeaver/core-connections';
import { useDataContext, useDataContextLink } from '@cloudbeaver/core-data-context';
import { useService } from '@cloudbeaver/core-di';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { type ITabData, Tab, TabIcon, TabTitle } from '@cloudbeaver/core-ui';
import { CaptureViewContext } from '@cloudbeaver/core-view';
import type { TabHandlerTabComponent } from '@cloudbeaver/plugin-navigation-tabs';
import {
  DATA_CONTEXT_SQL_EDITOR_STATE,
  ESqlDataSourceFeatures,
  getSqlEditorName,
  type ISqlEditorTabState,
  SqlDataSourceService,
} from '@cloudbeaver/plugin-sql-editor';

import { DATA_CONTEXT_SQL_EDITOR_TAB } from './DATA_CONTEXT_SQL_EDITOR_TAB.js';
import sqlEditorTabStyles from './SqlEditorTab.module.css';

export const SqlEditorTab: TabHandlerTabComponent<ISqlEditorTabState> = observer(function SqlEditorTab({ tab, onSelect, onClose }) {
  const viewContext = useContext(CaptureViewContext);
  const tabMenuContext = useDataContext(viewContext);
  const handlerState = tab.handlerState;

  useDataContextLink(tabMenuContext, (context, id) => {
    context.set(DATA_CONTEXT_SQL_EDITOR_TAB, true, id);
    context.set(DATA_CONTEXT_SQL_EDITOR_STATE, handlerState, id);
  });

  const sqlDataSourceService = useService(SqlDataSourceService);
  const connectionInfo = useService(ConnectionInfoResource);
  const projectInfo = useService(ProjectInfoResource);

  const translate = useTranslate();

  const dataSource = sqlDataSourceService.get(handlerState.editorId);
  const executionContext = dataSource?.executionContext;
  const project = executionContext ? projectInfo.get(executionContext.projectId) : undefined;
  const connection = executionContext
    ? connectionInfo.get(createConnectionParam(executionContext.projectId, executionContext.connectionId))
    : undefined;

  const name = getSqlEditorName(handlerState, dataSource, connection);
  const icon = dataSource?.icon ?? '/icons/sql_script_m.svg';
  const saved = dataSource?.isSaved !== false;
  const isScript = dataSource?.hasFeature(ESqlDataSourceFeatures.script);
  const isReadonly = Boolean(dataSource?.isReadonly());
  const hasUnsavedMark = !saved && !isReadonly;

  const handleSelect = ({ tabId }: ITabData<any>) => onSelect(tabId);
  const handleClose = onClose ? ({ tabId }: ITabData<any>) => onClose(tabId) : undefined;

  const tooltip = useObjectInfoTooltip(connection?.name, executionContext?.defaultCatalog, executionContext?.defaultSchema, project?.name);

  return (
    <Tab tabId={tab.id} title={`${name}${tooltip ? '\n' + tooltip : ''}`} menuContext={tabMenuContext} onOpen={handleSelect} onClose={handleClose}>
      <TabIcon icon={icon} />
      <TabTitle>{name}</TabTitle>
      {isReadonly && isScript && (
        <IconOrImage title={translate('ui_readonly')} icon="/icons/lock.png" className={s(sqlEditorTabStyles, { readonlyIcon: true })} />
      )}
      {hasUnsavedMark && <div className={s(sqlEditorTabStyles, { unsavedMark: true })} />}
    </Tab>
  );
});
