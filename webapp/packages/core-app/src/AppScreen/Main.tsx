/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { getComputed, Loader, Pane, ResizerControls, s, Split, useS, useSplitUserState } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { LeftBarPanelService, SideBarPanel, SideBarPanelService } from '@cloudbeaver/core-ui';

import style from './Main.module.css';
import { RightArea } from './RightArea.js';

export const Main = observer(function Main() {
  const styles = useS(style);
  const sideBarPanelService = useService(SideBarPanelService);
  const leftBarPanelService = useService(LeftBarPanelService);

  const splitMainState = useSplitUserState('main');
  const splitRightState = useSplitUserState('main-right');

  const sideBarDisabled = getComputed(() => sideBarPanelService.tabsContainer.getDisplayed().length === 0);
  const leftBarDisabled = getComputed(() => leftBarPanelService.tabsContainer.getDisplayed().length === 0);

  return (
    <Loader className={s(styles, { loader: true })} suspense>
      <main className={s(styles, { space: true })}>
        <Split {...splitMainState} sticky={30} mode={leftBarDisabled ? 'minimize' : splitMainState.mode} disable={leftBarDisabled}>
          <Pane className={s(styles, { pane: true })} basis="250px" main>
            <Loader suspense>
              <SideBarPanel container={leftBarPanelService.tabsContainer} />
            </Loader>
          </Pane>
          <ResizerControls />
          <Pane className={s(styles, { pane: true })}>
            <Split {...splitRightState} mode={sideBarDisabled ? 'minimize' : splitRightState.mode} disable={sideBarDisabled} sticky={30}>
              <Pane className={s(styles, { pane: true })}>
                <RightArea />
              </Pane>
              <ResizerControls />
              <Pane className={s(styles, { pane: true })} basis="250px" main>
                <Loader className={s(styles, { loader: true })} suspense>
                  <SideBarPanel container={sideBarPanelService.tabsContainer} />
                </Loader>
              </Pane>
            </Split>
          </Pane>
        </Split>
      </main>
    </Loader>
  );
});
