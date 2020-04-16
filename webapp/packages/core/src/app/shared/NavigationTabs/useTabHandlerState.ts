/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useService } from '@dbeaver/core/di';

import { NavigationTabsService } from './NavigationTabsService';

export function useTabHandlerState<T>(tabId: string, handlerId: string) {
  const navigationTabs = useService(NavigationTabsService);

  const tab = navigationTabs.getTab(tabId);
  if (!tab) {
    throw new Error(`Tab ${tabId} not found`);
  }

  const state = tab.getHandlerState<T>(handlerId);

  return state;
}
