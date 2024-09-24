/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, SContext, type StyleRegistry, useS } from '@cloudbeaver/core-blocks';

import TabStyles from '../Tabs/Tab/Tab.module.css';
import { TabList } from '../Tabs/TabList.js';
import TabPanelStyles from '../Tabs/TabPanel.module.css';
import { TabPanelList } from '../Tabs/TabPanelList.js';
import type { TabsContainer } from '../Tabs/TabsContainer/TabsContainer.js';
import { TabsState } from '../Tabs/TabsState.js';
import styles from './shared/SideBarPanel.module.css';
import SideBarPanelTab from './shared/SideBarPanelTab.module.css';
import SideBarPanelTabPanel from './shared/SideBarPanelTabPanel.module.css';

export interface SideBarPanelProps {
  container: TabsContainer;
}

const sideBarPanelRegistry: StyleRegistry = [
  [
    TabStyles,
    {
      mode: 'append',
      styles: [SideBarPanelTab],
    },
  ],
  [
    TabPanelStyles,
    {
      mode: 'append',
      styles: [SideBarPanelTabPanel],
    },
  ],
];

export const SideBarPanel = observer<SideBarPanelProps>(function SideBarPanel({ container }) {
  const style = useS(styles);

  return (
    <SContext registry={sideBarPanelRegistry}>
      <TabsState container={container} lazy>
        <div className={s(style, { box: true })}>
          <TabList className={s(style, { tabList: true })} underline />
          <div className={s(style, { contentBox: true })}>
            <TabPanelList />
          </div>
        </div>
      </TabsState>
    </SContext>
  );
});
