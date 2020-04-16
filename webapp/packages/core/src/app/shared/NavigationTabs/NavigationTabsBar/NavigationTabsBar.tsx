/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback } from 'react';
import { css } from 'reshadow';

import { TabsBoxFromArray, TextPlaceholder } from '@dbeaver/core/blocks';
import { useService } from '@dbeaver/core/di';
import { composes } from '@dbeaver/core/theming';

import { NavigationTabsService } from '../NavigationTabsService';
import { TabContent } from './Tabs/TabContent';
import { TabData } from './Tabs/TabData';

const styles = composes(
  css`
    Tab {
      composes: theme-ripple theme-background-background theme-text-text-primary-on-light from global;
    }
    tabs {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }
  `
);

export const NavigationTabsBar = observer(function NavigationTabsBar() {
  const navigation = useService(NavigationTabsService);
  const handleSelect = useCallback((tabId: string) => navigation.selectTab(tabId), [navigation]);
  const handleClose = useCallback((tabId: string) => navigation.closeTab(tabId), [navigation]);

  if (navigation.tabIdList.length === 0) {
    return (
      <TextPlaceholder>
        There are no objects to show. Double click on an object in the navigation tree to open it.
      </TextPlaceholder>
    );
  }

  return (
    <TabsBoxFromArray
      currentTabId={navigation.currentTabId}
      tabIdList={navigation.tabIdList}
      tab={TabContent}
      panel={TabData}
      onOpen={handleSelect}
      onClose={handleClose}
      style={[styles]}
    />
  );
});
