/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext, useState } from 'react';

import { CaptureViewContext } from '@cloudbeaver/core-view';
import { TableViewerLoader } from '@cloudbeaver/plugin-data-viewer';

import type { IResultGroup, IResultTab } from '../ISqlEditorTabState';
import { DATA_CONTEXT_SQL_EDITOR_RESULT_SET_PRESENTATION } from './DATA_CONTEXT_SQL_EDITOR_RESULT_SET_PRESENTATION';
import style from './SqlResultSetPanel.m.css';

interface Props {
  group: IResultGroup;
  resultTab: IResultTab;
}

export const SqlResultSetPanel = observer<Props>(function SqlResultSetPanel({ group, resultTab }) {
  const viewContext = useContext(CaptureViewContext);
  if (!viewContext) {
    throw new Error('View context not found');
  }

  const presentationContext = viewContext.get(DATA_CONTEXT_SQL_EDITOR_RESULT_SET_PRESENTATION);
  const [presentationId, setPresentation] = useState(presentationContext.presentationId);
  const [valuePresentationId, setValuePresentation] = useState<string | null>(presentationContext.valuePresentationId);

  viewContext.set(DATA_CONTEXT_SQL_EDITOR_RESULT_SET_PRESENTATION, {
    presentationId,
    valuePresentationId,
  });

  return (
    <TableViewerLoader
      className={style.tableViewerLoader}
      tableId={group.modelId}
      resultIndex={resultTab.indexInResultSet}
      presentationId={presentationId}
      valuePresentationId={valuePresentationId}
      onPresentationChange={setPresentation}
      onValuePresentationChange={setValuePresentation}
    />
  );
});
