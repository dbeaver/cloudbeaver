/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect, useMemo, useCallback } from 'react';
import { useTabState } from 'reakit/Tab';

import { TabsContainer } from './TabsContainer';
import { TabsContext, ITabsContext } from './TabsContext';

type Props<T = Record<string, any>> = T & React.PropsWithChildren<{
  selectedId?: string;
  orientation?: 'horizontal' | 'vertical';
  currentTabId?: string | null;
  container?: TabsContainer<T>;
  lazy?: boolean;
  manual?: boolean;
  onChange?: (tabId: string) => any;
}>;

export function TabsState<T = Record<string, any>>({
  selectedId,
  orientation,
  currentTabId,
  container,
  children,
  lazy = false,
  manual,
  onChange,
  ...rest
}: Props<T>): React.ReactElement | null {
  if (!currentTabId && container && container.tabInfoList.length > 0) {
    currentTabId = container.tabInfoList[0].key;
  }

  const state = useTabState({
    selectedId: selectedId || currentTabId,
    orientation,
    manual,
  });

  if (currentTabId) {
    state.selectedId = currentTabId;
  }

  useEffect(() => {
    if (!currentTabId) {
      return;
    }
    state.select(currentTabId);
  }, [currentTabId]); // hack currentId and selectedId not works

  const handleChange = useCallback((tabId: string) => onChange?.(tabId), [onChange]);

  const value = useMemo<ITabsContext<T>>(() => ({
    state,
    container,
    lazy,
    props: rest as T,
    select: handleChange,
  }), [...Object.values(state), handleChange, ...Object.values(rest), lazy, container]);

  return (
    <TabsContext.Provider value={value}>
      {children}
    </TabsContext.Provider>
  );
}
