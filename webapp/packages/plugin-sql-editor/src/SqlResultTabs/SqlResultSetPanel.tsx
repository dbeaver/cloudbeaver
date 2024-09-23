/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { useService } from '@cloudbeaver/core-di';
import { TableViewerLoader } from '@cloudbeaver/plugin-data-viewer';

import type { IResultTab, ISqlEditorTabState } from '../ISqlEditorTabState.js';
import { SqlQueryResultService } from './SqlQueryResultService.js';
import style from './SqlResultSetPanel.module.css';

interface Props {
  state: ISqlEditorTabState;
  resultTab: IResultTab;
}

export const SqlResultSetPanel = observer<Props>(function SqlResultSetPanel({ state, resultTab }) {
  const sqlQueryResultService = useService(SqlQueryResultService);
  const group = state.resultGroups.find(group => group.groupId === resultTab.groupId);

  function onPresentationChange(presentationId: string) {
    sqlQueryResultService.updateResultTab(state, resultTab.tabId, {
      presentationId,
    });
  }

  function onValuePresentationChange(valuePresentationId: string | null) {
    sqlQueryResultService.updateResultTab(state, resultTab.tabId, {
      valuePresentationId,
    });
  }

  if (!group) {
    throw new Error('Result group not found');
  }

  return (
    <TableViewerLoader
      className={style['tableViewerLoader']}
      tableId={group.modelId}
      resultIndex={resultTab.indexInResultSet}
      presentationId={resultTab.presentationId}
      valuePresentationId={resultTab.valuePresentationId}
      onPresentationChange={onPresentationChange}
      onValuePresentationChange={onValuePresentationChange}
    />
  );
});
