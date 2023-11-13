/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Loader, Pane, ResizerControls, s, Split, useS, useSplitUserState } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CaptureView } from '@cloudbeaver/core-view';

import type { ISqlEditorTabState } from './ISqlEditorTabState';
import { SqlDataSourceService } from './SqlDataSource/SqlDataSourceService';
import style from './SqlEditor.m.css';
import { SqlEditorLoader } from './SqlEditor/SqlEditorLoader';
import { SqlEditorOverlay } from './SqlEditorOverlay';
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

  return (
    <Loader suspense>
      <CaptureView className={s(styles, { captureView: true })} view={sqlEditorView}>
        <Split {...splitState} split="horizontal" sticky={30}>
          <Pane className={s(styles, { pane: true })}>
            <SqlEditorLoader state={state} />
          </Pane>
          <ResizerControls />
          <Pane className={s(styles, { pane: true })} basis="50%" main>
            <Loader suspense>
              <SqlResultTabs state={state} />
            </Loader>
          </Pane>
        </Split>
        <SqlEditorOverlay state={state} />
      </CaptureView>
    </Loader>
  );
});
