/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Loader, Pane, Placeholder, ResizerControls, s, SlideDialog, Split, useExecutor, useS, useSplitUserState } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { BottomPanel, BottomPanelService, OptionsPanelService, useTabPersistence } from '@cloudbeaver/core-ui';

import { AppScreenService, PANEL_ID_BOTTOM_PANEL, PANEL_ID_MAIN_CONTENT } from './AppScreenService.js';
import style from './RightArea.module.css';

interface Props {
  className?: string;
}

export const RightArea = observer<Props>(function RightArea({ className }) {
  const styles = useS(style);
  const appScreenService = useService(AppScreenService);
  const optionsPanelService = useService(OptionsPanelService);
  const bottomPanelService = useService(BottomPanelService);
  const bottomPanelState = useTabPersistence(PANEL_ID_BOTTOM_PANEL, bottomPanelService.tabsContainer);
  const splitState = useSplitUserState('right-area');

  const OptionsPanel = optionsPanelService.getPanelComponent();

  const bottomPanelDisabled = bottomPanelService.tabsContainer.getDisplayed().length === 0;

  useExecutor({
    executor: bottomPanelService.tabsContainer.onTabSelect,
    handlers: [
      function showBottomPanel() {
        if (bottomPanelService.tabsContainer.getDisplayed().length === 0) {
          return;
        }

        if (splitState.size === 0) {
          splitState.onResize?.(-1, -1);
        }

        if (splitState.mode === 'minimize') {
          splitState.onModeChange?.('resize');
        }
      },
    ],
  });

  function close() {
    optionsPanelService.close();
  }

  return (
    <div data-panel-id={PANEL_ID_MAIN_CONTENT} tabIndex={-1} className={s(styles, { container: true }, className)}>
      <Split
        {...splitState}
        sticky={30}
        split="horizontal"
        mode={bottomPanelDisabled ? 'minimize' : splitState.mode}
        disable={bottomPanelDisabled}
        keepRatio
      >
        <Pane className={s(styles, { pane: true })}>
          <Loader className={s(styles, { loader: true })} suspense>
            <Placeholder container={appScreenService.rightAreaTop} />
          </Loader>
        </Pane>
        <ResizerControls />
        <Pane className={s(styles, { pane: true })} basis="30%" main>
          <Loader className={s(styles, { loader: true })} suspense>
            <BottomPanel
              container={bottomPanelService.tabsContainer}
              panelId={PANEL_ID_BOTTOM_PANEL}
              selectedTabId={bottomPanelState.selectedTabId}
              onSelectTab={bottomPanelState.selectTab}
            />
          </Loader>
        </Pane>
      </Split>
      <SlideDialog open={optionsPanelService.active} onClose={close}>
        <OptionsPanel />
      </SlideDialog>
    </div>
  );
});
