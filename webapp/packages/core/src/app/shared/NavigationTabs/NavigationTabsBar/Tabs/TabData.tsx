/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import {
  Tab, TabPanel, TabsBox, TabElementProps,
} from '@dbeaver/core/blocks';
import { useService } from '@dbeaver/core/di';
import { useStyles, composes } from '@dbeaver/core/theming';

import { NavigationTabsService } from '../../NavigationTabsService';
import { HandlerContent } from './HandlerContent';
import { HandlerData } from './HandlerData';
import { useTab } from './useTab';
import { useTabHandlers } from './useTabHandlers';

const styles = composes(
  css`
    Tab {
      composes: theme-ripple theme-background-surface theme-text-text-primary-on-light from global;
    }
    tabs {
      composes: theme-background-background theme-text-text-primary-on-light from global;
    }
  `
);

export const TabData = observer(function TabData({ tabId }: TabElementProps) {
  const tab = useTab(tabId);
  const handlers = useTabHandlers(tabId);
  const navigation = useService(NavigationTabsService);
  const handleSelectHandler = useCallback((handlerId: string) => navigation.selectHandler(handlerId), [navigation]);

  return styled(useStyles(styles))(
    <TabsBox
      currentTabId={tab.handlerId}
      tabs={handlers.length > 1 && handlers.map(handlerId => (
        <Tab
          key={handlerId}
          tabId={handlerId}
          onOpen={handleSelectHandler}
        >
          <HandlerContent handlerId={handlerId}/>
        </Tab>
      ))}
      style={[styles]}
    >
      {handlers.map(handlerId => (
        <TabPanel key={handlerId} tabId={handlerId}>
          <HandlerData tabId={tabId} handlerId={handlerId} />
        </TabPanel>
      ))}
    </TabsBox>
  );
});
