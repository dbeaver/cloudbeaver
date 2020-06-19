/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { TabHandlerPanelProps } from '@cloudbeaver/core-app';
import {
  splitStyles, Split, ResizerControls, Pane, splitHorizontalStyles,
} from '@cloudbeaver/core-blocks';
import { useStyles } from '@cloudbeaver/core-theming';

import { ISqlEditorTabState } from './ISqlEditorTabState';
import { SqlEditor } from './SqlEditor';
import { SqlResultTabs } from './SqlResultTabs/SqlResultTabs';

const viewerStyles = css`
  Pane {
    composes: theme-typography--body2 from global;
    display: flex;
  }
  SqlEditor {
    composes: theme-typography--body1 from global;
  }
`;

export function SqlEditorPanel({ tab }: TabHandlerPanelProps<ISqlEditorTabState>) {
  return styled(useStyles(splitStyles, splitHorizontalStyles, viewerStyles))(
    <Split split="horizontal" sticky={30}>
      <Pane>
        <SqlEditor tabId={tab.id}/>
      </Pane>
      <ResizerControls />
      <Pane main={true}>
        <SqlResultTabs tab={tab}/>
      </Pane>
    </Split>
  );
}
