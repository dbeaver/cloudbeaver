/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-blocks';

import { BASE_TAB_STYLES } from '../Tabs/Tab/BASE_TAB_STYLES';
import { UNDERLINE_TAB_STYLES } from '../Tabs/Tab/UnderlineTabStyles';
import { TabList } from '../Tabs/TabList';
import { TabPanelList } from '../Tabs/TabPanelList';
import type { TabsContainer } from '../Tabs/TabsContainer/TabsContainer';
import { TabsState } from '../Tabs/TabsState';

const tabsStyles = css`
  TabList {
    display: flex;
    position: relative;
    flex-shrink: 0;
    align-items: center;
    overflow: auto;
  }
  TabPanel {
    display: flex;
    flex-direction: column;
  }
  tab-outer:only-child {
    display: none;
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

export const SideBarPanel = observer<Props>(function SideBarPanel({ container }) {
  const tabStyle = [BASE_TAB_STYLES, tabsStyles, UNDERLINE_TAB_STYLES];

  return styled(useStyles(tabStyle, formStyles))(
    <TabsState container={container} lazy>
      <box>
        <TabList style={tabStyle} />
        <content-box>
          <TabPanelList style={tabStyle} />
        </content-box>
      </box>
    </TabsState>,
  );
});
