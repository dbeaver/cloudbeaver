/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, SContext, type StyleRegistry, useS } from '@cloudbeaver/core-blocks';

import { baseTabStyles, TabPanelListNew, underlineTabStyles } from '..';
import { TabList } from '../Tabs/TabList';
import type { TabsContainer } from '../Tabs/TabsContainer/TabsContainer';
import { TabsState } from '../Tabs/TabsState';
import styles from './SideBarPanel.m.css';

interface Props {
  container: TabsContainer;
}

const sideBarPanelRegistry: StyleRegistry = [
  [
    baseTabStyles,
    {
      mode: 'append',
      styles: [underlineTabStyles, styles],
    },
  ],
];

export const SideBarPanel = observer<Props>(function SideBarPanel({ container }) {
  const style = useS(baseTabStyles, underlineTabStyles, styles);

  return (
    <SContext registry={sideBarPanelRegistry}>
      <TabsState container={container} lazy>
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
