/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { splitStyles, Split, ResizerControls, Pane, splitHorizontalStyles, useSplitUserState, Loader, useStyles } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CaptureView } from '@cloudbeaver/core-view';

import type { ISqlEditorTabState } from './ISqlEditorTabState';
import { SqlDataSourceService } from './SqlDataSource/SqlDataSourceService';
import { SqlEditorLoader } from './SqlEditor/SqlEditorLoader';
import { SqlEditorOverlay } from './SqlEditorOverlay';
import { SqlEditorStatusBar } from './SqlEditorStatusBar';
import { SqlEditorView } from './SqlEditorView';
import { SqlResultTabs } from './SqlResultTabs/SqlResultTabs';
import { useDataSource } from './useDataSource';

const viewerStyles = css`
  CaptureView {
    flex: 1;
    display: flex;
    overflow: auto;
    position: relative;
  }
  Pane {
    composes: theme-typography--body2 from global;
    display: flex;
    position: relative;
  }
  Pane:first-child {
    flex-direction: column;
  }
  SqlEditorLoader {
    composes: theme-typography--body1 from global;
  }
`;

interface Props {
  state: ISqlEditorTabState;
}

export const SqlEditor = observer<Props>(function SqlEditor({ state }) {
  const sqlEditorView = useService(SqlEditorView);
  const sqlDataSourceService = useService(SqlDataSourceService);
  const styles = useStyles(splitStyles, splitHorizontalStyles, viewerStyles);
  const dataSource = sqlDataSourceService.get(state.editorId);

  useDataSource(dataSource);
  const splitState = useSplitUserState(`sql-editor-${dataSource?.sourceKey ?? 'default'}`);

  return styled(styles)(
    <Loader suspense>
      <CaptureView view={sqlEditorView}>
        <Split {...splitState} split="horizontal" sticky={30}>
          <Pane>
            <SqlEditorLoader state={state} />
          </Pane>
          <ResizerControls />
          <Pane basis='50%' main>
            <Loader suspense>
              <SqlResultTabs state={state} />
            </Loader>
          </Pane>
        </Split>
        <SqlEditorOverlay state={state} />
        <SqlEditorStatusBar dataSource={dataSource} />
      </CaptureView>
    </Loader>
  );
});
