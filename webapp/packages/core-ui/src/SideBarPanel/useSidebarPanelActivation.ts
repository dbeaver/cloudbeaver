/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect, useRef, type RefObject } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';

import type { TabsContainer } from '../Tabs/TabsContainer/TabsContainer.js';
import type { SidebarActivationService } from './SidebarActivationService.js';

interface ISidebarSelection {
  selectedTabId: string | undefined;
}

export function useSidebarPanelActivation(
  service: SidebarActivationService,
  container: TabsContainer,
  selection: ISidebarSelection,
): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);
  const selectionRef = useObjectRef(selection);
  const request = service.getRequest(container);

  useEffect(() => service.registerPanel(container, () => selectionRef.selectedTabId), [service, container, selectionRef]);

  useEffect(() => {
    if (!request) {
      return;
    }

    if (!container.getIdList().includes(request.tabId)) {
      service.completeRequest(container, request);
      return;
    }

    if (selection.selectedTabId !== request.tabId) {
      container.select(request.tabId);

      return;
    }

    const tab = Array.from(ref.current?.querySelectorAll<HTMLElement>('[role="tab"]') ?? []).find(tab => tab.dataset['id'] === request.tabId);
    (tab ?? ref.current)?.focus({ preventScroll: true });
    service.completeRequest(container, request);
  }, [service, container, request, selection.selectedTabId, selectionRef]);

  return ref;
}
