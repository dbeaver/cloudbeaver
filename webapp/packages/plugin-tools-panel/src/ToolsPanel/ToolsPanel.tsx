/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { s, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { TabList, TabPanelList, TabsState, useTabOrderPersistence, useTabPersistence } from '@cloudbeaver/core-ui';

import styles from './ToolsPanel.module.css';
import { ToolsPanelService } from './ToolsPanelService.js';

const PANEL_ID = 'tools-panel';

export const ToolsPanel = observer(function ToolsPanel() {
  const toolsPanelService = useService(ToolsPanelService);
  const style = useS(styles);

  const { onReorder, sortTabs, persistenceKey } = useTabOrderPersistence(PANEL_ID, () => toolsPanelService.tabsContainer.getIdList());
  const { selectedTabId, selectTab } = useTabPersistence(PANEL_ID, toolsPanelService.tabsContainer);

  return (
    <TabsState
      currentTabId={selectedTabId}
      container={toolsPanelService.tabsContainer}
      reorderStateKey={persistenceKey}
      sortFunction={sortTabs}
      lazy
      onChange={tab => selectTab(tab.tabId)}
      onReorder={onReorder}
    >
      <div className={s(style, { box: true })}>
        <TabList className={s(style, { tabList: true })} underline />
        <div className={s(style, { contentBox: true })}>
          <TabPanelList />
        </div>
      </div>
    </TabsState>
  );
});
