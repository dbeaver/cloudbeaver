/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import type { TabHandlerPanelComponent } from '@cloudbeaver/core-app';
import {
  splitStyles, Split, ResizerControls, Pane, splitHorizontalStyles, useTab
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

export const SqlEditorPanel: TabHandlerPanelComponent<ISqlEditorTabState> = function SqlEditorPanel({ tab }) {
  const baseTab = useTab(tab.id);
  const styles = useStyles(splitStyles, splitHorizontalStyles, viewerStyles);
  // const navigatorService = useService(SqlEditorNavigatorService);

  // const handleOpen = ({ tabId }: ITabData<any>) => navigatorService.openEditorResult(editorId, tabId);
  // const handleClose = ({ tabId }: ITabData<any>) => navigatorService.closeEditorResult(editorId, tabId);

  if (!baseTab.selected) {
    return null;
  }

  return styled(styles)(
    <Split split="horizontal" sticky={30}>
      <Pane>
        <SqlEditorLoader state={tab.handlerState} />
      </Pane>
      <ResizerControls />
      <Pane main>
        <SqlResultTabs editorId={tab.id} state={tab.handlerState} />
      </Pane>
    </Split>
  );
};
