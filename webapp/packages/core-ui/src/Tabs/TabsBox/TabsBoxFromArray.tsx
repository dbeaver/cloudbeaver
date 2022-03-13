/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { useStyles, ComponentStyle } from '@cloudbeaver/core-theming';

import { BASE_TAB_STYLES } from '../Tab/BASE_TAB_STYLES';
import { Tab } from '../Tab/Tab';
import { TabPanel } from '../TabPanel';
import type { ITabData } from '../TabsContainer/ITabsContainer';
import { TabsBox } from './TabsBox';

export interface TabElementProps {
  tabId: string;
}

interface IProps {
  currentTabId: string;
  tabIdList: string[];
  tab: React.ElementType<TabElementProps>;
  panel: React.ElementType<TabElementProps>;
  hideTabs?: boolean;
  onOpen: (tab: ITabData<any>) => void;
  onClose?: (tab: ITabData<any>) => void;
  className?: string;
  style?: ComponentStyle;
}

export const TabsBoxFromArray = observer<IProps>(function TabsBoxFromArray({
  currentTabId,
  tabIdList,
  tab: TabData,
  panel: PanelData,
  hideTabs,
  onOpen,
  onClose,
  className,
  style,
}) {
  return styled(useStyles(BASE_TAB_STYLES, style))(
    <TabsBox
      currentTabId={currentTabId}
      tabs={!hideTabs && tabIdList.map(tabId => (
        <Tab key={tabId} tabId={tabId} onOpen={onOpen} onClose={onClose}>
          <TabData tabId={tabId} />
        </Tab>
      ))}
      className={className}
      style={style}
    >
      {tabIdList.map(tabId => (
        <TabPanel key={tabId} tabId={tabId}>
          <PanelData tabId={tabId} />
        </TabPanel>
      ))}
    </TabsBox>
  );
});
