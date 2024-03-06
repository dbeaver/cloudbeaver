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

import { s, SContext, StyleRegistry, useS, useUserData } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { baseTabStyles, ITabData, TabList, TabPanelListNew, TabsState, underlineTabStyles } from '@cloudbeaver/core-ui';
import { isArraysEqual } from '@cloudbeaver/core-utils';

import styles from './ToolsPanel.m.css';
import { ToolsPanelService } from './ToolsPanelService';

interface IToolsState {
  selectedTabId: string | undefined;
}

const ToolsPanelRegistry: StyleRegistry = [[baseTabStyles, { mode: 'append', styles: [underlineTabStyles, styles] }]];

export const ToolsPanel = observer(function ToolsPanel() {
  const toolsPanelService = useService(ToolsPanelService);
  const style = useS(baseTabStyles, underlineTabStyles, styles);

  const state = useUserData<IToolsState>('tools', () => ({ selectedTabId: undefined }));
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

  return (
    <SContext registry={ToolsPanelRegistry}>
      <TabsState currentTabId={state.selectedTabId} container={toolsPanelService.tabsContainer} lazy onChange={handleTabChange}>
        <div className={s(style, { box: true })}>
          <TabList className={s(style, { tabList: true })} />
          <div className={s(style, { contentBox: true })}>
            <TabPanelListNew />
          </div>
        </div>
      </TabsState>
    </SContext>
  );
});
