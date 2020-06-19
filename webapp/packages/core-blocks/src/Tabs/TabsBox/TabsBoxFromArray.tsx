/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled from 'reshadow';

import { useStyles, Style } from '@cloudbeaver/core-theming';

import { Tab } from '../Tab';
import { TabPanel } from '../TabPanel';
import { TabsBox } from './TabsBox';

export interface TabElementProps {
  tabId: string;
}

type TabsBoxControllerProps ={
  currentTabId: string;
  tabIdList: string[];
  tab: React.ElementType<TabElementProps>;
  panel: React.ElementType<TabElementProps>;
  hideTabs?: boolean;
  onOpen: (tabId: string) => void;
  onClose?: (tabId: string) => void;
  className?: string;
  style?: Style[];
}

export const TabsBoxFromArray = observer(function TabsBoxFromArray({
  currentTabId,
  tabIdList,
  tab: TabData,
  panel: PanelData,
  hideTabs,
  onOpen,
  onClose,
  className,
  style = [],
}: TabsBoxControllerProps) {
  return styled(useStyles(...style))(
    <TabsBox
      currentTabId={currentTabId}
      tabs={!hideTabs && tabIdList.map(tabId => (
        <Tab key={tabId} tabId={tabId} onOpen={onOpen} onClose={onClose}>
          <TabData tabId={tabId}/>
        </Tab>
      ))}
      className={className}
      style={style}
    >
      {tabIdList?.map(tabId => (
        <TabPanel key={tabId} tabId={tabId}>
          <PanelData tabId={tabId}/>
        </TabPanel>
      ))}
    </TabsBox>
  );
});
