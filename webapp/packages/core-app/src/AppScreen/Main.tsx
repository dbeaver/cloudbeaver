/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { splitStyles, Split, ResizerControls, Pane, useSplitUserState, useStyles, Loader, getComputed } from '@cloudbeaver/core-blocks';
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
      <space as="main">
        <Split
          {...splitMainState}
          sticky={30}
          mode={leftBarDisabled ? 'minimize' : splitMainState.mode}
          disable={leftBarDisabled}
        >
          <Pane main>
            <Loader suspense>
              <SideBarPanel container={leftBarPanelService.tabsContainer} />
            </Loader>
          </Pane>
          <ResizerControls />
          <Pane>
            <Split
              {...splitRightState}
              mode={sideBarDisabled ? 'minimize' : splitRightState.mode}
              disable={sideBarDisabled}
              sticky={30}
            >
              <Pane>
                <RightArea />
              </Pane>
              <ResizerControls />
              <Pane main>
                <Loader suspense>
                  <SideBarPanel container={sideBarPanelService.tabsContainer} />
                </Loader>
              </Pane>
            </Split>
          </Pane>
        </Split>
      </space>
    </Loader>
  );
});
