/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Loader, Pane, ResizerControls, s, Split, useS, useSplitUserState } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CaptureView } from '@cloudbeaver/core-view';

import type { ISqlEditorTabState } from './ISqlEditorTabState.js';
import { SqlDataSourceService } from './SqlDataSource/SqlDataSourceService.js';
import style from './SqlEditor.module.css';
import { SqlEditorLoader } from './SqlEditor/SqlEditorLoader.js';
import { SqlEditorOpenOverlay } from './SqlEditorOpenOverlay.js';
import { SqlEditorOverlay } from './SqlEditorOverlay.js';
import { SqlEditorStatusBar } from './SqlEditorStatusBar.js';
import { SqlEditorView } from './SqlEditorView.js';
import { SqlResultTabs } from './SqlResultTabs/SqlResultTabs.js';
import { useDataSource } from './useDataSource.js';

export interface SqlEditorProps {
  state: ISqlEditorTabState;
}

export const SqlEditor = observer<SqlEditorProps>(function SqlEditor({ state }) {
  const styles = useS(style);
  const sqlEditorView = useService(SqlEditorView);
  const sqlDataSourceService = useService(SqlDataSourceService);
  const dataSource = sqlDataSourceService.get(state.editorId);

  useDataSource(dataSource);
  const splitState = useSplitUserState(`sql-editor-${dataSource?.sourceKey ?? 'default'}`);

  const opened = dataSource?.isOpened() || false;

  return (
    <Loader suspense>
      <CaptureView className={s(styles, { captureView: true })} view={sqlEditorView}>
        <Split {...splitState} split="horizontal" sticky={30}>
          <Pane className={s(styles, { pane: true })} basis="50%" main>
            <SqlEditorLoader state={state} />
          </Pane>
          <ResizerControls />
          <Pane className={s(styles, { pane: true })}>
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
