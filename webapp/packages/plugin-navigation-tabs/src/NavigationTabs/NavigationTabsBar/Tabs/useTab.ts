/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useService } from '@cloudbeaver/core-di';

import { NavigationTabsService } from '../../NavigationTabsService';

export function useTab(tabId: string) {
  const navigationTabs = useService(NavigationTabsService);

  const tab = navigationTabs.getTab(tabId);
  if (!tab) {
    throw new Error(`Tab ${tabId} not found`);
  }

  return tab;
}
