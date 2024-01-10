/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, untracked } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useRef } from 'react';
import styled from 'reshadow';

import { s, useS, useStyles, useUserData } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { BASE_TAB_STYLES, ITabData, TabList, TabPanelList, TabsState, UNDERLINE_TAB_STYLES } from '@cloudbeaver/core-ui';
import { isArraysEqual } from '@cloudbeaver/core-utils';

import styles from './ToolsPanel.m.css';
import { ToolsPanelService } from './ToolsPanelService';

interface IToolsState {
  selectedTabId: string | undefined;
}

export const ToolsPanel = observer(function ToolsPanel() {
  const toolsPanelService = useService(ToolsPanelService);
  const style = useS(styles);

  const state = useUserData<IToolsState>('tools', () => ({ selectedTabId: undefined }));
  const tabStyle = [BASE_TAB_STYLES, UNDERLINE_TAB_STYLES];
  const tabs = toolsPanelService.tabsContainer.getIdList();
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

  return styled(useStyles(tabStyle))(
    <TabsState currentTabId={state.selectedTabId} container={toolsPanelService.tabsContainer} lazy onChange={handleTabChange}>
      <div className={s(style, { box: true })}>
        <TabList className={s(style, { tabList: true })} style={tabStyle} />
        <div className={s(style, { contentBox: true })}>
          <TabPanelList style={tabStyle} />
        </div>
      </div>
    </TabsState>,
  );
});
