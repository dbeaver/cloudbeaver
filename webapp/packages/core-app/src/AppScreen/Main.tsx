/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Loader, Pane, ResizerControls, s, SContext, Split, useS, type StyleRegistry } from '@cloudbeaver/core-blocks';
import { BottomPanel, PanelFocus, SideBarPanel, TabStyles } from '@cloudbeaver/core-ui';

import { PANEL_ID_BOTTOM_PANEL, PANEL_ID_LEFT_SIDEBAR, PANEL_ID_RIGHT_SIDEBAR } from './AppScreenService.js';
import { RightArea } from './RightArea.js';
import style from './Main.module.css';
import LeftSideBarPanel from './LeftSideBarPanel.module.css';
import { useMainPanelState } from './useMainPanelState.js';

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
  const panels = useMainPanelState();

  return (
    <Loader className={s(styles, { loader: true })} suspense>
      <main className={s(styles, { space: true })}>
        <Split {...panels.layout.mainSplit} sticky={30} mode={panels.layout.mainMode} disable={panels.layout.leftDisabled}>
          <Pane className={s(styles, { pane: true })} basis="250px" main>
            <Loader suspense>
              <SContext registry={LEFT_SIDEBAR_PANEL_REGISTRY}>
                <SideBarPanel
                  container={panels.left.container}
                  panelId={PANEL_ID_LEFT_SIDEBAR}
                  selectedTabId={panels.left.selection.selectedTabId}
                  onSelectTab={panels.left.selection.selectTab}
                >
                  <PanelFocus activation={panels.left.activation} />
                </SideBarPanel>
              </SContext>
            </Loader>
          </Pane>
          <ResizerControls />
          <Pane className={s(styles, { pane: true })}>
            <Split {...panels.layout.rightSplit} mode={panels.layout.rightMode} disable={panels.layout.rightDisabled} sticky={30}>
              <Pane className={s(styles, { pane: true })}>
                <RightArea
                  splitState={panels.layout.bottomSplit}
                  bottomPanelDisabled={panels.layout.bottomDisabled}
                  bottomPanelSlot={
                    <BottomPanel
                      container={panels.bottom.container}
                      panelId={PANEL_ID_BOTTOM_PANEL}
                      selectedTabId={panels.bottom.selection.selectedTabId}
                      onSelectTab={panels.bottom.selection.selectTab}
                    >
                      <PanelFocus activation={panels.bottom.activation} />
                    </BottomPanel>
                  }
                />
              </Pane>
              <ResizerControls />
              <Pane className={s(styles, { pane: true })} basis="400px" main dialogPersistent>
                <Loader className={s(styles, { loader: true })} suspense>
                  <SideBarPanel
                    container={panels.right.container}
                    panelId={PANEL_ID_RIGHT_SIDEBAR}
                    selectedTabId={panels.right.selection.selectedTabId}
                    onSelectTab={panels.right.selection.selectTab}
                  >
                    <PanelFocus activation={panels.right.activation} />
                  </SideBarPanel>
                </Loader>
              </Pane>
            </Split>
          </Pane>
        </Split>
      </main>
    </Loader>
  );
});
