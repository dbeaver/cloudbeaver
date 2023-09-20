/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  Loader,
  Pane,
  ResizerControls,
  s,
  SlideBox,
  SlideBoxStyles,
  SlideElement,
  SlideOverlay,
  Split,
  SplitHorizontalStyles,
  SplitStyles,
  useS,
  useSplitUserState,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { OptionsPanelService } from '@cloudbeaver/core-ui';
import { NavigationTabsBar } from '@cloudbeaver/plugin-navigation-tabs';
import { ToolsPanel, ToolsPanelService } from '@cloudbeaver/plugin-tools-panel';

import style from './RightArea.m.css';

interface Props {
  className?: string;
}

export const RightArea = observer<Props>(function RightArea({ className }) {
  const styles = useS(SplitStyles, SplitHorizontalStyles, SlideBoxStyles, style);
  const toolsPanelService = useService(ToolsPanelService);
  const optionsPanelService = useService(OptionsPanelService);
  const splitState = useSplitUserState('right-area');

  const OptionsPanel = optionsPanelService.getPanelComponent();
  const activeTools = toolsPanelService.tabsContainer.getDisplayed();

  const toolsDisabled = activeTools.length === 0 || toolsPanelService.disabled;

  return (
    <SlideBox open={optionsPanelService.active} className={s(styles, { slideBox: true, open: optionsPanelService.active }, className)}>
      <SlideElement className={s(styles, { slideElement: true })}>
        <Loader className={s(styles, { loader: true })} suspense>
          <OptionsPanel />
        </Loader>
      </SlideElement>
      <SlideElement className={s(styles, { slideElement: true })}>
        <Split
          className={s(styles, { split: true })}
          {...splitState}
          sticky={30}
          split="horizontal"
          mode={toolsDisabled ? 'minimize' : splitState.mode}
          disable={toolsDisabled}
          keepRatio
        >
          <Pane className={s(styles, { pane: true })}>
            <Loader className={s(styles, { loader: true })} suspense>
              <NavigationTabsBar />
            </Loader>
          </Pane>
          <ResizerControls className={s(styles, { resizerControls: true })} />
          <Pane className={s(styles, { pane: true })} basis="30%" main>
            <Loader className={s(styles, { loader: true })} suspense>
              <ToolsPanel container={toolsPanelService.tabsContainer} />
            </Loader>
          </Pane>
        </Split>
        <SlideOverlay className={s(styles, { slideOverlay: true })} onClick={() => optionsPanelService.close()} />
      </SlideElement>
    </SlideBox>
  );
});
