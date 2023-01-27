/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import {
  Pane,
  ResizerControls,
  SlideBox,
  SlideElement,
  slideBoxStyles,
  Split,
  splitHorizontalStyles,
  splitStyles,
  SlideOverlay,
  useStyles,
  ErrorBoundary,
  useSplitUserState,
  Loader
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { OptionsPanelService } from '@cloudbeaver/core-ui';
import { NavigationTabsBar } from '@cloudbeaver/plugin-navigation-tabs';
import { ToolsPanelService, ToolsPanel } from '@cloudbeaver/plugin-tools-panel';

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

  return styled(useStyles(styles, splitStyles, splitHorizontalStyles, slideBoxStyles))(
    <SlideBox open={optionsPanelService.active} className={className}>
      <SlideElement>
        <ErrorBoundary remount>
          <Loader loading={false} overlay>
            <OptionsPanel />
          </Loader>
        </ErrorBoundary>
      </SlideElement>
      <SlideElement>
        <Split
          {...splitState}
          sticky={30}
          split="horizontal"
          mode={activeTools.length ? splitState.mode : 'minimize'}
          disable={activeTools.length === 0}
          keepRatio
        >
          <Pane>
            <ErrorBoundary remount>
              <Loader loading={false} overlay>
                <NavigationTabsBar />
              </Loader>
            </ErrorBoundary>
          </Pane>
          <ResizerControls />
          <Pane basis='30%' main>
            <ErrorBoundary remount>
              <Loader loading={false} overlay>
                <ToolsPanel container={toolsPanelService.tabsContainer} />
              </Loader>
            </ErrorBoundary>
          </Pane>
        </Split>
        <SlideOverlay onClick={() => optionsPanelService.close()} />
      </SlideElement>
    </SlideBox>
  );
});
