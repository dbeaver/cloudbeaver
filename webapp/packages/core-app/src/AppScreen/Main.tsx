/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import {
  getComputed,
  Loader,
  Pane,
  ResizerControls,
  SContext,
  Split,
  useExecutor,
  useSplitUserState,
  type StyleRegistry,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { LeftBarPanelService, SideBarPanel, SideBarPanelService, TabStyles } from '@cloudbeaver/core-ui';

import { RightArea } from './RightArea.js';
import './Main.css';
import LeftSideBarPanel from './LeftSideBarPanel.module.css';

const LEFT_SIDEBAR_PANEL_REGISTRY: StyleRegistry = [
  [
    TabStyles,
    {
      mode: 'append',
      styles: [LeftSideBarPanel],
    },
  ],
];

export const Main = observer(function Main() {
  const sideBarPanelService = useService(SideBarPanelService);
  const leftBarPanelService = useService(LeftBarPanelService);

  const splitMainState = useSplitUserState('main');
  const splitRightState = useSplitUserState('main-right');

  const sideBarDisabled = getComputed(() => sideBarPanelService.tabsContainer.getDisplayed().length === 0);
  const leftBarDisabled = getComputed(() => leftBarPanelService.tabsContainer.getDisplayed().length === 0);

  useExecutor({
    executor: sideBarPanelService.tabsContainer.onTabSelect,
    handlers: [
      function showPanel() {
        if (splitRightState.mode === 'minimize' && !sideBarDisabled) {
          splitRightState.onModeChange?.('resize');
        }
      },
    ],
  });

  return (
    <Loader className="main-loader" suspense>
      <main className="main-space">
        <Split {...splitMainState} sticky={30} mode={leftBarDisabled ? 'minimize' : splitMainState.mode} disable={leftBarDisabled}>
          <Pane className="main-pane" basis="250px" main>
            <Loader suspense>
              <SContext registry={LEFT_SIDEBAR_PANEL_REGISTRY}>
                <SideBarPanel container={leftBarPanelService.tabsContainer} panelId="dbeaver-left-sidebar" />
              </SContext>
            </Loader>
          </Pane>
          <ResizerControls />
          <Pane className="main-pane">
            <Split {...splitRightState} mode={sideBarDisabled ? 'minimize' : splitRightState.mode} disable={sideBarDisabled} sticky={30}>
              <Pane className="main-pane">
                <RightArea />
              </Pane>
              <ResizerControls />
              <Pane className="main-pane" basis="400px" main>
                <Loader className="main-loader" suspense>
                  <SideBarPanel container={sideBarPanelService.tabsContainer} panelId="dbeaver-right-sidebar" />
                </Loader>
              </Pane>
            </Split>
          </Pane>
        </Split>
      </main>
    </Loader>
  );
});
