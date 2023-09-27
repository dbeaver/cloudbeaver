/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import {
  getComputed,
  InputField, InputFiles,
  Loader,
  Pane,
  Radio,
  ResizerControls,
  Split,
  splitStyles,
  useSplitUserState,
  useStyles,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { LeftBarPanelService, SideBarPanel, SideBarPanelService } from '@cloudbeaver/core-ui';

import { RightArea } from './RightArea';

const mainStyles = css`
  space {
    composes: theme-typography--body2 theme-background-primary from global;
  }
  Pane {
    composes: theme-background-surface theme-text-on-surface from global;
    display: flex;
    position: relative;
    overflow: hidden;
  }
  Loader {
    height: 100%;
  }
`;

export const Main = observer(function Main() {
  const sideBarPanelService = useService(SideBarPanelService);
  const leftBarPanelService = useService(LeftBarPanelService);

  const styles = useStyles(mainStyles, splitStyles);
  const splitMainState = useSplitUserState('main');
  const splitRightState = useSplitUserState('main-right');

  const sideBarDisabled = getComputed(() => sideBarPanelService.tabsContainer.getDisplayed().length === 0);
  const leftBarDisabled = getComputed(() => leftBarPanelService.tabsContainer.getDisplayed().length === 0);

  return styled(styles)(
    <Loader suspense>
      <InputFiles>Label</InputFiles>
    </Loader>,
  );
});
