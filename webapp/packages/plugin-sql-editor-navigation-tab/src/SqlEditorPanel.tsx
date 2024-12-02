/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { DATA_CONTEXT_TAB_ID, useTab } from '@cloudbeaver/core-ui';
import { useCaptureViewContext } from '@cloudbeaver/core-view';
import type { TabHandlerPanelComponent } from '@cloudbeaver/plugin-navigation-tabs';
import { DATA_CONTEXT_SQL_EDITOR_STATE, type ISqlEditorTabState, SqlEditor } from '@cloudbeaver/plugin-sql-editor';

export const SqlEditorPanel: TabHandlerPanelComponent<ISqlEditorTabState> = observer(function SqlEditorPanel({ tab }) {
  const baseTab = useTab(tab.id);
  const handlerState = tab.handlerState;

  useCaptureViewContext((context, id) => {
    if (baseTab.selected) {
      context.set(DATA_CONTEXT_TAB_ID, tab.id, id);
      context.set(DATA_CONTEXT_SQL_EDITOR_STATE, handlerState, id);
    }
  });

  // const navigatorService = useService(SqlEditorNavigatorService);

  // const handleOpen = ({ tabId }: ITabData<any>) => navigatorService.openEditorResult(editorId, tabId);
  // const handleClose = ({ tabId }: ITabData<any>) => navigatorService.closeEditorResult(editorId, tabId);

  if (!baseTab.selected) {
    return null;
  }

  return <SqlEditor state={handlerState} />;
});
