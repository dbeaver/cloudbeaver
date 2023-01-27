/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { splitStyles, Split, ResizerControls, Pane, ErrorBoundary, useSplitUserState, useStyles, Loader } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { SideBarPanel, SideBarPanelService } from '@cloudbeaver/core-ui';
import { NavigationTreeLoader } from '@cloudbeaver/plugin-navigation-tree';

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

  const styles = useStyles(mainStyles, splitStyles);
  const splitMainState = useSplitUserState('main');
  const splitRightState = useSplitUserState('main-right');

  const activeBars = sideBarPanelService.tabsContainer.getDisplayed();

  return styled(styles)(
    <Loader loading={false} overlay>
      <space as="main">
        <Split {...splitMainState} sticky={30}>
          <Pane main>
            <ErrorBoundary remount>
              <Loader loading={false} overlay>
                <NavigationTreeLoader />
              </Loader>
            </ErrorBoundary>
          </Pane>
          <ResizerControls />
          <Pane>
            <Split {...splitRightState} disable={activeBars.length === 0} sticky={30}>
              <Pane>
                <RightArea />
              </Pane>
              <ResizerControls />
              <Pane main>
                <ErrorBoundary remount>
                  <Loader loading={false} overlay>
                    <SideBarPanel container={sideBarPanelService.tabsContainer} />
                  </Loader>
                </ErrorBoundary>
              </Pane>
            </Split>
          </Pane>
        </Split>
      </space>
    </Loader>
  );
});
