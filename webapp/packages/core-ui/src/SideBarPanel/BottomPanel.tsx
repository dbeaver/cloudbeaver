/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, useS } from '@cloudbeaver/core-blocks';

import { TabList } from '../Tabs/TabList.js';
import { TabPanelList } from '../Tabs/TabPanelList.js';
import type { TabsContainer } from '../Tabs/TabsContainer/TabsContainer.js';
import { TabsState } from '../Tabs/TabsState.js';
import { useTabOrderPersistence } from '../Tabs/useTabOrderPersistence.js';
import styles from './BottomPanel.module.css';

export interface IBottomPanelProps {
  container: TabsContainer;
  panelId: string;
  selectedTabId: string | undefined;
  onSelectTab: (tabId: string) => void;
}

export const BottomPanel = observer<IBottomPanelProps>(function BottomPanel({ container, panelId, selectedTabId, onSelectTab }) {
  const style = useS(styles);
  const { onReorder, sortTabs, persistenceKey } = useTabOrderPersistence(panelId, () => container.getIdList());

  return (
    <TabsState
      container={container}
      currentTabId={selectedTabId}
      reorderStateKey={persistenceKey}
      sortFunction={sortTabs}
      lazy
      onChange={tab => onSelectTab(tab.tabId)}
      onReorder={onReorder}
    >
      <div tabIndex={-1} className={s(style, { box: true })} data-panel-id={panelId}>
        <TabList className={s(style, { tabList: true })} underline />
        <div className={s(style, { contentBox: true })}>
          <TabPanelList />
        </div>
      </div>
    </TabsState>
  );
});
