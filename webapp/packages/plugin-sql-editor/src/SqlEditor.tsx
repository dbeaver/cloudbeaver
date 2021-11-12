/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import {
  splitStyles, Split, ResizerControls, Pane, splitHorizontalStyles
} from '@cloudbeaver/core-blocks';
import { useStyles } from '@cloudbeaver/core-theming';

import type { ISqlEditorTabState } from './ISqlEditorTabState';
import { SqlEditorLoader } from './SqlEditor/SqlEditorLoader';
import { SqlResultTabs } from './SqlResultTabs/SqlResultTabs';

const viewerStyles = css`
  Pane {
    composes: theme-typography--body2 from global;
    display: flex;
  }
  SqlEditorLoader {
    composes: theme-typography--body1 from global;
  }
`;

interface Props {
  editorId: string;
  state: ISqlEditorTabState;
}

export const SqlEditor = observer<Props>(function SqlEditor({ editorId, state }) {
  const styles = useStyles(splitStyles, splitHorizontalStyles, viewerStyles);

  return styled(styles)(
    <Split split="horizontal" sticky={30}>
      <Pane>
        <SqlEditorLoader state={state} />
      </Pane>
      <ResizerControls />
      <Pane main>
        <SqlResultTabs editorId={editorId} state={state} />
      </Pane>
    </Split>
  );
});
