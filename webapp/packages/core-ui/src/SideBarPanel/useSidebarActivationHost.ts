/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect } from 'react';

import { useExecutor, useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import type { TabsContainer } from '../Tabs/TabsContainer/TabsContainer.js';
import { SidebarActivationService, type ISidebarActivationHost } from './SidebarActivationService.js';

export function useSidebarActivationHost(container: TabsContainer, host: ISidebarActivationHost): void {
  const sidebarActivationService = useService(SidebarActivationService);
  const hostRef = useObjectRef(host);

  useEffect(() => sidebarActivationService.registerHost(container, hostRef), [sidebarActivationService, container, hostRef]);

  useExecutor({
    executor: container.onTabSelect,
    handlers: [() => hostRef.reveal()],
  });
}
