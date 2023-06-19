/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, untracked } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useRef } from 'react';
import styled, { css } from 'reshadow';

import { useStyles, useUserData } from '@cloudbeaver/core-blocks';
import { BASE_TAB_STYLES, ITabData, ITabsContainer, TabList, TabPanelList, TabsState, UNDERLINE_TAB_STYLES } from '@cloudbeaver/core-ui';
import { isArraysEqual } from '@cloudbeaver/core-utils';

const tabsStyles = css`
  TabList {
    display: flex;
    position: relative;
    flex-shrink: 0;
    align-items: center;
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
  container: ITabsContainer;
}

interface IToolsState {
  selectedTabId: string | undefined;
}

export const ToolsPanel = observer<Props>(function ToolsPanel({ container }) {
  const state = useUserData<IToolsState>('tools', () => ({ selectedTabId: undefined }));
  const tabStyle = [BASE_TAB_STYLES, tabsStyles, UNDERLINE_TAB_STYLES];
  const tabs = container.getIdList();
  const prevTabs = useRef<string[]>(tabs);
  const equal = isArraysEqual(prevTabs.current, tabs);

  untracked(
    action(() => {
      if (!equal) {
        for (const id of tabs) {
          if (!prevTabs.current.includes(id)) {
            state.selectedTabId = id;
            break;
          }
        }

        prevTabs.current = tabs;
      }

      if (state.selectedTabId) {
        if (!tabs.includes(state.selectedTabId)) {
          if (tabs.length > 0) {
            state.selectedTabId = tabs[0];
          } else {
            state.selectedTabId = undefined;
          }
        }
      }
    }),
  );

  function handleTabChange(tab: ITabData) {
    state.selectedTabId = tab.tabId;
  }

  return styled(useStyles(tabStyle, formStyles))(
    <TabsState currentTabId={state.selectedTabId} container={container} lazy onChange={handleTabChange}>
      <box>
        <TabList style={tabStyle} />
        <content-box>
          <TabPanelList style={tabStyle} />
        </content-box>
      </box>
    </TabsState>,
  );
});
