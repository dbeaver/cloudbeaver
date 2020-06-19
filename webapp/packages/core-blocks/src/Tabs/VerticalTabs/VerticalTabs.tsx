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

import { ITabContainer } from '../ITab';
import { TabList } from '../TabList';
import { TabsState } from '../TabsState';
import { VerticalTabHeader } from './VerticalTabHeader';
import { VerticalTabPanel } from './VerticalTabPanel';
import { verticalTabStyles } from './verticalTabStyles';

type VerticalTabsProps = Omit<React.DOMAttributes<HTMLDivElement>, 'style'> & {
  tabContainer: ITabContainer;
  style: Style[];
};

export const VerticalTabs = observer(function VerticalTabs({ tabContainer, style, ...props }: VerticalTabsProps) {

  return styled(useStyles(verticalTabStyles, ...style))(
    <TabsState currentTabId={tabContainer.currentTabId} orientation='vertical'>
      <vertical-tabs as="div" {...props}>
        <TabList aria-label="My tabs">
          {tabContainer.tabs.map(tab => (
            <VerticalTabHeader key={tab.tabId} tab={tab} style={style} />
          ))}
        </TabList>
        {tabContainer.tabs.map(tab => (
          <VerticalTabPanel key={tab.tabId} tab={tab} style={style}/>
        ))}
      </vertical-tabs>
    </TabsState>
  );
});
