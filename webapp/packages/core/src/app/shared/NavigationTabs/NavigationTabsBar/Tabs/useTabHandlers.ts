/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useService } from '@dbeaver/core/di';

import { NavigationTabsService } from '../../NavigationTabsService';

export function useTabHandlers(nodeId: string) {
  const navigation = useService(NavigationTabsService);

  const handlers = navigation.sortedHandlerList.filter(
    handlerId => navigation.getTabHandler(handlerId)!.isActive(nodeId)
  );

  return handlers;
}
