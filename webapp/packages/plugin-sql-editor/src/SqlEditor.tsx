/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import { getComputed, Loader, Pane, ResizerControls, s, Split, useS, useSplit, useSplitUserState } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CaptureView } from '@cloudbeaver/core-view';

import type { ISqlEditorTabState } from './ISqlEditorTabState';
import { SqlDataSourceService } from './SqlDataSource/SqlDataSourceService';
import style from './SqlEditor.m.css';
import { SqlEditorLoader } from './SqlEditor/SqlEditorLoader';
import { useSqlEditor } from './SqlEditor/useSqlEditor';
import { SqlEditorModeService } from './SqlEditorModeService';
import { SqlEditorOpenOverlay } from './SqlEditorOpenOverlay';
import { SqlEditorOverlay } from './SqlEditorOverlay';
import { SqlEditorStatusBar } from './SqlEditorStatusBar';
import { SqlEditorView } from './SqlEditorView';
import { SqlResultTabs } from './SqlResultTabs/SqlResultTabs';
import { useDataSource } from './useDataSource';

interface Props {
  state: ISqlEditorTabState;
}

export const SqlEditor = observer<Props>(function SqlEditor({ state }) {
  const styles = useS(style);
  const sqlEditorView = useService(SqlEditorView);
  const sqlDataSourceService = useService(SqlDataSourceService);
  const dataSource = sqlDataSourceService.get(state.editorId);

  useDataSource(dataSource);
  const splitState = useSplitUserState(`sql-editor-${dataSource?.sourceKey ?? 'default'}`);

  const opened = dataSource?.isOpened() || false;

  const split = useSplit();
  const data = useSqlEditor(state);
  const sqlEditorModeService = useService(SqlEditorModeService);
  const displayedEditors = getComputed(() => sqlEditorModeService.tabsContainer.getDisplayed({ state, data }).length);
  const isEditorEmpty = displayedEditors === 0;

  useEffect(() => {
    if (isEditorEmpty) {
      split.fixate('maximize', true);
    } else if (split.state.disable) {
      split.fixate('resize', false);
      split.state.setSize(-1);
    }
  }, [isEditorEmpty]);

  return (
    <Loader suspense>
      <CaptureView className={s(styles, { captureView: true })} view={sqlEditorView}>
        <Split {...splitState} disable={isEditorEmpty} split="horizontal" sticky={30}>
          <Pane className={s(styles, { pane: true })} main>
            <SqlEditorLoader state={state} />
          </Pane>
          <ResizerControls />
          <Pane className={s(styles, { pane: true })} basis="50%">
            <Loader suspense>
              <SqlResultTabs state={state} />
            </Loader>
          </Pane>
        </Split>
        {opened && <SqlEditorOverlay state={state} />}
        {!opened && <SqlEditorOpenOverlay dataSource={dataSource} />}
        <SqlEditorStatusBar dataSource={dataSource} />
      </CaptureView>
    </Loader>
  );
});
