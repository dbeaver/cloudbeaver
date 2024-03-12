/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, SContext, type StyleRegistry, useS } from '@cloudbeaver/core-blocks';

import { tabPanelStyles } from '..';
import baseTabStyles from '../Tabs/Tab/baseTab.m.css';
import underlineTabStyles from '../Tabs/Tab/underlineTabStyles.m.css';
import { TabList } from '../Tabs/TabList';
import { TabPanelList } from '../Tabs/TabPanelList';
import type { TabsContainer } from '../Tabs/TabsContainer/TabsContainer';
import { TabsState } from '../Tabs/TabsState';
import styles from './styles/SideBarPanel.m.css';
import tabStyles from './styles/SideBarPanelTab.m.css';
import tabPanelRegistryStyle from './styles/SideBarPanelTabPanel.m.css';

interface Props {
  container: TabsContainer;
}

const sideBarPanelRegistry: StyleRegistry = [
  [
    baseTabStyles,
    {
      mode: 'append',
      styles: [underlineTabStyles, tabStyles],
    },
  ],
  [
    tabPanelStyles,
    {
      mode: 'append',
      styles: [tabPanelRegistryStyle],
    },
  ],
];

export const SideBarPanel = observer<Props>(function SideBarPanel({ container }) {
  const style = useS(styles);

  return (
    <SContext registry={sideBarPanelRegistry}>
      <TabsState container={container} lazy>
        <div className={s(style, { box: true })}>
          <TabList className={s(style, { tabList: true })} />
          <div className={s(style, { contentBox: true })}>
            <TabPanelList />
          </div>
        </div>
      </TabsState>
    </SContext>
  );
});
