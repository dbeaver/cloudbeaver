/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import {
  Pane, ResizerControls, Split, splitHorizontalStyles, splitStyles,
} from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { NavigationTabsBar } from '../shared/NavigationTabs/NavigationTabsBar';
import { LogViewTab } from '../shared/ToolsPanel/LogViewTab/LogViewTab';
import { LogViewTabController } from '../shared/ToolsPanel/LogViewTab/LogViewTabController';

const styles = composes(
  css`
    Pane {
      composes: theme-background-surface theme-text-on-surface from global;
    }
  `,
  css`
    Pane {
      flex: 1;
      display: flex;
      overflow: auto;
    }
    Pane:last-child {
      flex: 0 0 30%;
    }
  `
);

export const RightArea = observer(function RightArea() {
  const controller = useController(LogViewTabController);

  return styled(useStyles(styles, splitStyles, splitHorizontalStyles))(
    <Split sticky={30} split="horizontal" mode={controller.isActive ? undefined : 'minimize'} keepRatio>
      <Pane>
        <NavigationTabsBar />
      </Pane>
      {controller.isActive && <ResizerControls />}
      <Pane main={true}>
        <LogViewTab />
      </Pane>
    </Split>
  );
});
