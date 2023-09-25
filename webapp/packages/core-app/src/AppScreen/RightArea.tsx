/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Loader, Pane, ResizerControls, s, SlideBox, SlideElement, SlideOverlay, Split, useS, useSplitUserState } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { OptionsPanelService } from '@cloudbeaver/core-ui';
import { NavigationTabsBar } from '@cloudbeaver/plugin-navigation-tabs';
import { ToolsPanel, ToolsPanelService } from '@cloudbeaver/plugin-tools-panel';

import style from './RightArea.m.css';

interface Props {
  className?: string;
}

export const RightArea = observer<Props>(function RightArea({ className }) {
  const styles = useS(style);
  const toolsPanelService = useService(ToolsPanelService);
  const optionsPanelService = useService(OptionsPanelService);
  const splitState = useSplitUserState('right-area');

  const OptionsPanel = optionsPanelService.getPanelComponent();
  const activeTools = toolsPanelService.tabsContainer.getDisplayed();

  const toolsDisabled = activeTools.length === 0 || toolsPanelService.disabled;

  return (
    <SlideBox open={optionsPanelService.active} className={s(styles, { slideBox: true }, className)}>
      <SlideElement>
        <Loader className={s(styles, { loader: true })} suspense>
          <OptionsPanel />
        </Loader>
      </SlideElement>
      <SlideElement>
        <Split {...splitState} sticky={30} split="horizontal" mode={toolsDisabled ? 'minimize' : splitState.mode} disable={toolsDisabled} keepRatio>
          <Pane>
            <Loader className={s(styles, { loader: true })} suspense>
              <NavigationTabsBar />
            </Loader>
          </Pane>
          <ResizerControls />
          <Pane basis="30%" main>
            <Loader className={s(styles, { loader: true })} suspense>
              <ToolsPanel container={toolsPanelService.tabsContainer} />
            </Loader>
          </Pane>
        </Split>
        <SlideOverlay />
      </SlideElement>
    </SlideBox>
  );
});
