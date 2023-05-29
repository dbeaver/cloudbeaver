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
  Loader,
  Pane,
  ResizerControls,
  SlideBox,
  slideBoxStyles,
  SlideElement,
  SlideOverlay,
  Split,
  splitHorizontalStyles,
  splitStyles,
  useSplitUserState,
  useStyles,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { OptionsPanelService } from '@cloudbeaver/core-ui';
import { NavigationTabsBar } from '@cloudbeaver/plugin-navigation-tabs';
import { ToolsPanel, ToolsPanelService } from '@cloudbeaver/plugin-tools-panel';

const styles = css`
  Pane {
    composes: theme-background-surface theme-text-on-surface from global;
    display: flex;
    overflow: auto;
  }
  Loader {
    height: 100%;
  }
  SlideBox {
    flex: 1;
  }
`;

interface Props {
  className?: string;
}

export const RightArea = observer<Props>(function RightArea({ className }) {
  const toolsPanelService = useService(ToolsPanelService);
  const optionsPanelService = useService(OptionsPanelService);
  const splitState = useSplitUserState('right-area');

  const OptionsPanel = optionsPanelService.getPanelComponent();
  const activeTools = toolsPanelService.tabsContainer.getDisplayed();

  const toolsDisabled = activeTools.length === 0 || toolsPanelService.disabled;

  return styled(useStyles(styles, splitStyles, splitHorizontalStyles, slideBoxStyles))(
    <SlideBox open={optionsPanelService.active} className={className}>
      <SlideElement>
        <Loader suspense>
          <OptionsPanel />
        </Loader>
      </SlideElement>
      <SlideElement>
        <Split {...splitState} sticky={30} split="horizontal" mode={toolsDisabled ? 'minimize' : splitState.mode} disable={toolsDisabled} keepRatio>
          <Pane>
            <Loader suspense>
              <NavigationTabsBar />
            </Loader>
          </Pane>
          <ResizerControls />
          <Pane basis="30%" main>
            <Loader suspense>
              <ToolsPanel container={toolsPanelService.tabsContainer} />
            </Loader>
          </Pane>
        </Split>
        <SlideOverlay onClick={() => optionsPanelService.close()} />
      </SlideElement>
    </SlideBox>,
  );
});
