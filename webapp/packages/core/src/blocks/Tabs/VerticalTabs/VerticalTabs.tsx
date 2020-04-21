/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { TabList, useTabState } from 'reakit/Tab';
import styled, { css } from 'reshadow';

import { composes, useStyles } from '@dbeaver/core/theming';

import { ITabContainer } from '../ITab';
import { TabsContext } from '../TabsContext';
import { VerticalTabHeader } from './VerticalTabHeader';
import { VerticalTabPanel } from './VerticalTabPanel';

const tabStyles = composes(
  css`
    TabList {
      composes: theme-background-surface theme-text-on-surface theme-border-color-background from global;
    }
  `,
  css`
    vertical-tabs {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    TabList {
      display: flex;
      flex-direction: column;
      flex: 0 0 auto;
      min-width: 150px;
      border-right: 1px solid;
      border-top: 1px solid;
      overflow: auto;
    }
  `
);

type VerticalTabsProps = React.DOMAttributes<HTMLDivElement> & {
  tabContainer: ITabContainer;
};

export const VerticalTabs = observer(function VerticalTabs({ tabContainer, ...props }: VerticalTabsProps) {
  const tabState = useTabState({
    selectedId: tabContainer.currentTabId,
    orientation: 'vertical',
    manual: true,
  });
  tabState.select(tabContainer.currentTabId);

  return styled(useStyles(tabStyles))(
    <vertical-tabs as="div" {...props}>
      <TabsContext.Provider value={tabState}>
        <TabList {...tabState} aria-label="My tabs">
          {tabContainer.tabs.map(tab => (
            <VerticalTabHeader key={tab.tabId} tab={tab} />
          ))}
        </TabList>
        {tabContainer.tabs.map(tab => (
          <VerticalTabPanel key={tab.tabId} tab={tab}/>
        ))}
      </TabsContext.Provider>
    </vertical-tabs>
  );
});
