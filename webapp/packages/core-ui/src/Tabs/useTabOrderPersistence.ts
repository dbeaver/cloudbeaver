/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useCallback } from 'react';
import { useUserData } from '@cloudbeaver/core-blocks';
import { reorderArray } from '@dbeaver/js-helpers';

import type { ITabsContainer } from './TabsContainer/ITabsContainer.js';

export function useTabOrderPersistence(
  persistenceKey: string,
  container: ITabsContainer<any, any>,
): (draggedTabId: string, targetTabId: string, position: 'before' | 'after') => void {
  const tabOrderKey = `tabs-order-${persistenceKey}`;
  const displayed = container.getIdList();
  const tabsPersisted = useUserData(
    tabOrderKey,
    () => ({}) as Record<string, number>,
    order => {
      container.applyOrder(order);
    },
  );

  const onReorder = useCallback(
    (draggedTabId: string, targetTabId: string, position: 'before' | 'after') => {
      const result = reorderArray(displayed, draggedTabId, { item: targetTabId, position });
      const orderMap = result.reduce(
        (acc, tabId, index) => {
          acc[tabId] = index;
          return acc;
        },
        {} as Record<string, number>,
      );
      Object.assign(tabsPersisted, orderMap);
      container.applyOrder(orderMap);
    },
    [container, displayed, tabsPersisted],
  );

  return onReorder;
}
