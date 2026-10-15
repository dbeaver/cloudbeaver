/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useService } from '@cloudbeaver/core-di';

import { NavigationTabsService } from '../../NavigationTabsService.js';

export function useTabHandler(handlerId: string) {
  const navigationTabsService = useService(NavigationTabsService);
  const handler = navigationTabsService.getTabHandler(handlerId);

  if (!handler) {
    throw new Error(`Tab Handler ${handlerId} not found`);
  }

  return handler;
}
