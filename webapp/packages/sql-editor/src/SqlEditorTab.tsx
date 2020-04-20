/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import {
  splitStyles, Split, ResizerControls, Pane, splitHorizontalStyles,
} from '@dbeaver/core/blocks';
import { useStyles } from '@dbeaver/core/theming';

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

type SqlEditorTabProps = {
  tabId: string;
  handlerId: string;
}

export function SqlEditorTab({ tabId }: SqlEditorTabProps) {
  return styled(useStyles(splitStyles, splitHorizontalStyles, viewerStyles))(
    <Split split="horizontal" sticky={30}>
      <Pane>
        <SqlEditor tabId={tabId}/>
      </Pane>
      <ResizerControls />
      <Pane main={true}>
        <SqlResultTabs tabId={tabId}/>
      </Pane>
    </Split>
  );
}
