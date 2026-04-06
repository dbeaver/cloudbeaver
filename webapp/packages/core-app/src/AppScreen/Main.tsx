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
  s,
  SContext,
  Split,
  useExecutor,
  useS,
  useSplitUserState,
  type StyleRegistry,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { LeftBarPanelService, SideBarPanel, SideBarPanelService, TabStyles } from '@cloudbeaver/core-ui';

import { PANEL_ID_LEFT_SIDEBAR, PANEL_ID_RIGHT_SIDEBAR } from './AppScreenService.js';
import { RightArea } from './RightArea.js';
import style from './Main.module.css';
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
  const styles = useS(style);
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
    <Loader className={s(styles, { loader: true })} suspense>
      <main className={s(styles, { space: true })}>
        <Split {...splitMainState} sticky={30} mode={leftBarDisabled ? 'minimize' : splitMainState.mode} disable={leftBarDisabled}>
          <Pane className={s(styles, { pane: true })} basis="250px" main>
            <Loader suspense>
              <SContext registry={LEFT_SIDEBAR_PANEL_REGISTRY}>
                <SideBarPanel container={leftBarPanelService.tabsContainer} panelId={PANEL_ID_LEFT_SIDEBAR} />
              </SContext>
            </Loader>
          </Pane>
          <ResizerControls />
          <Pane className={s(styles, { pane: true })}>
            <Split {...splitRightState} mode={sideBarDisabled ? 'minimize' : splitRightState.mode} disable={sideBarDisabled} sticky={30}>
              <Pane className={s(styles, { pane: true })}>
                <RightArea />
              </Pane>
              <ResizerControls />
              <Pane className={s(styles, { pane: true })} basis="400px" main>
                <Loader className={s(styles, { loader: true })} suspense>
                  <SideBarPanel container={sideBarPanelService.tabsContainer} panelId={PANEL_ID_RIGHT_SIDEBAR} />
                </Loader>
              </Pane>
            </Split>
          </Pane>
        </Split>
      </main>
    </Loader>
  );
});
