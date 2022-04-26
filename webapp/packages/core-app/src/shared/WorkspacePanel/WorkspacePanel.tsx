/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';
import { BASE_TAB_STYLES, TabList, TabPanelList, TabsContainer, TabsState, UNDERLINE_TAB_STYLES } from '@cloudbeaver/core-ui';

const tabsStyles = css`
  TabList {
    display: flex;
    position: relative;
    flex-shrink: 0;
    align-items: center;
    overflow: auto;
  }
  Tab {
    height: 36px!important;
    font-weight: 500 !important;
  }
  TabPanel {
    display: flex;
    flex-direction: column;
  }
`;

const formStyles = css`
  box {
    composes: theme-background-surface theme-text-on-surface from global;
    width: 100%;
    display: flex;
    flex-direction: column;
    flex: 1;
    height: 100%;
    overflow: auto;
  }
  content-box {
    composes: theme-border-color-background from global;
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow: auto;
  }
`;

interface Props {
  container: TabsContainer;
}

export const WorkspacePanel = observer<Props>(function WorkspacePanel({ container }) {
  const tabStyle = [BASE_TAB_STYLES, tabsStyles, UNDERLINE_TAB_STYLES];
  const showTabs = container.getDisplayed().length > 1;

  return styled(useStyles(tabStyle, formStyles))(
    <TabsState container={container} lazy>
      <box>
        {showTabs && <TabList style={tabStyle} />}
        <content-box>
          <TabPanelList style={tabStyle} />
        </content-box>
      </box>
    </TabsState>
  );
});