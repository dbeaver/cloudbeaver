/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useCallback, useMemo } from 'react';
import { useUserData } from '@cloudbeaver/core-blocks';
import { reorderArray } from '@dbeaver/js-helpers';

interface ITabOrderPersistenceResult {
  sortTabs: (tabs: string[]) => string[];
  onReorder: (draggedTabId: string, targetTabId: string, position: 'before' | 'after') => void;
  persistenceKey: string;
}

export function useTabOrderPersistence(persistenceKey: string, getTabIds: () => string[]): ITabOrderPersistenceResult {
  const tabOrderKey = `tabs-order-${persistenceKey}`;
  const tabsPersisted = useUserData(tabOrderKey, () => ({}) as Record<string, number>);

  const sortTabs = useCallback(
    (tabs: string[]): string[] =>
      tabs.toSorted((a, b) => {
        const orderA = tabsPersisted[a] ?? Number.MAX_SAFE_INTEGER;
        const orderB = tabsPersisted[b] ?? Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      }),
    [tabsPersisted],
  );

  const onReorder = useCallback(
    (draggedTabId: string, targetTabId: string, position: 'before' | 'after') => {
      const displayed = sortTabs(getTabIds());
      const result = reorderArray(displayed, draggedTabId, { item: targetTabId, position });
      const orderMap = result.reduce(
        (acc, tabId, index) => {
          acc[tabId] = index;
          return acc;
        },
        {} as Record<string, number>,
      );
      Object.assign(tabsPersisted, orderMap);
    },
    [getTabIds, sortTabs, tabsPersisted],
  );

  return useMemo(
    () => ({
      sortTabs,
      onReorder,
      persistenceKey: tabOrderKey,
    }),
    [sortTabs, onReorder, tabOrderKey],
  );
}
