/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect } from 'react';

import { useService } from '@cloudbeaver/core-di';

import type { TabsContainer } from '../Tabs/TabsContainer/TabsContainer.js';
import { useTabsState } from '../Tabs/useTabsState.js';
import { useTabsStore } from '../Tabs/useTabsStore.js';
import { SidebarActivationService } from './SidebarActivationService.js';

export function useSidebarPanelActivation(container: TabsContainer): void {
  const sidebarActivationService = useService(SidebarActivationService);
  const store = useTabsStore();
  const selectedId = useTabsState('selectedId');
  const renderedItems = useTabsState('renderedItems');
  const request = sidebarActivationService.getRequest(container);

  useEffect(
    () => sidebarActivationService.registerPanel(container, () => store.getState().selectedId ?? undefined),
    [sidebarActivationService, container, store],
  );

  useEffect(() => {
    if (!request) {
      return;
    }

    if (!container.getIdList().includes(request.tabId)) {
      sidebarActivationService.completeRequest(container, request);
      return;
    }

    if (selectedId !== request.tabId) {
      container.select(request.tabId);

      return;
    }

    if (!renderedItems.some(item => item.id === request.tabId && item.element)) {
      return;
    }

    store.move(request.tabId);
    sidebarActivationService.completeRequest(container, request);
  }, [sidebarActivationService, container, store, request, selectedId, renderedItems]);
}
