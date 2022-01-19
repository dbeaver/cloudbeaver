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
  ErrorBoundary
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useStyles, composes } from '@cloudbeaver/core-theming';
import { OptionsPanelService } from '@cloudbeaver/core-ui';

import { NavigationTabsBar } from '../shared/NavigationTabs/NavigationTabsBar';
import { LogViewer } from '../shared/ToolsPanel/LogViewer/LogViewer';
import { LogViewerService } from '../shared/ToolsPanel/LogViewer/LogViewerService';

const styles = composes(
  css`
    Pane {
      composes: theme-background-surface theme-text-on-surface from global;
    }
  `,
  css`
    Pane {
      flex: 1;
      display: flex;
      overflow: auto;
    }
    Pane:last-child {
      flex: 0 0 30%;
    }
    SlideBox {
      flex: 1;
    }
  `
);

export const RightArea = observer(function RightArea() {
  const logViewerService = useService(LogViewerService);
  const optionsPanelService = useService(OptionsPanelService);
  const OptionsPanel = optionsPanelService.getPanelComponent();

  return styled(useStyles(styles, splitStyles, splitHorizontalStyles, slideBoxStyles))(
    <SlideBox open={optionsPanelService.active}>
      <SlideElement>
        <ErrorBoundary remount><OptionsPanel /></ErrorBoundary>
      </SlideElement>
      <SlideElement>
        <Split sticky={30} split="horizontal" mode={logViewerService.isActive ? undefined : 'minimize'} keepRatio>
          <Pane>
            <ErrorBoundary remount>
              <NavigationTabsBar />
            </ErrorBoundary>
          </Pane>
          {logViewerService.isActive && <ResizerControls />}
          <Pane main>
            <ErrorBoundary remount>
              <LogViewer />
            </ErrorBoundary>
          </Pane>
        </Split>
        <SlideOverlay onClick={() => optionsPanelService.close()} />
      </SlideElement>
    </SlideBox>
  );
});
