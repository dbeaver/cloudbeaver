/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useService } from '@dbeaver/core/di';

import { NavigationTabsService } from '../NavigationTabsService';

export function useNavigationTabs() {
  const navigation = useService(NavigationTabsService);

  return {
    tabs: navigation.tabIdList,
    handlers: navigation.sortedHandlerList,
    currentId: navigation.currentTabId,
    selectHandler: (handlerId: string) => navigation.selectHandler(handlerId),
    selectTab: (tabId: string) => navigation.selectTab(tabId),
    closeTab: (tabId: string) => navigation.closeTab(tabId),
  };
}
