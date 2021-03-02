/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import {
  Pane, ResizerControls, SlideBox, SlideElement, slideBoxStyles, Split, splitHorizontalStyles, splitStyles, SlideOverlay
} from '@cloudbeaver/core-blocks';
import { useController, useService } from '@cloudbeaver/core-di';
import { useStyles, composes } from '@cloudbeaver/core-theming';
import { OptionsPanelService } from '@cloudbeaver/core-ui';

import { NavigationTabsBar } from '../shared/NavigationTabs/NavigationTabsBar';
import { LogViewTab } from '../shared/ToolsPanel/LogViewTab/LogViewTab';
import { LogViewTabController } from '../shared/ToolsPanel/LogViewTab/LogViewTabController';

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
    SlideElement {
      display: flex;
    }
  `
);

export const RightArea = observer(function RightArea() {
  const controller = useController(LogViewTabController);
  const optionsPanelService = useService(OptionsPanelService);
  const OptionsPanel = optionsPanelService.getPanelComponent();

  return styled(useStyles(styles, splitStyles, splitHorizontalStyles, slideBoxStyles))(
    <SlideBox open={optionsPanelService.active}>
      <SlideElement>
        <OptionsPanel />
      </SlideElement>
      <SlideElement>
        <Split sticky={30} split="horizontal" mode={controller.isActive ? undefined : 'minimize'} keepRatio>
          <Pane>
            <NavigationTabsBar />
          </Pane>
          {controller.isActive && <ResizerControls />}
          <Pane main>
            <LogViewTab />
          </Pane>
        </Split>
        <SlideOverlay onClick={() => optionsPanelService.close()} />
      </SlideElement>
    </SlideBox>
  );
});
