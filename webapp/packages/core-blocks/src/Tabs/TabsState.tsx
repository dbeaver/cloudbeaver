/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect, useMemo, useCallback } from 'react';
import { useTabState } from 'reakit/Tab';

import { TabsContext, ITabsContext } from './TabsContext';

type Props = React.PropsWithChildren<{
  selectedId?: string;
  orientation?: 'horizontal' | 'vertical';
  currentTabId?: string | null;
  manual?: boolean;
  onChange?: (tabId: string) => any;
}>

export function TabsState({
  selectedId,
  orientation,
  currentTabId,
  children,
  manual,
  onChange,
}: Props) {
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

  const handleChange = useCallback((tabId: string) => onChange && onChange(tabId), [onChange]);

  const value = useMemo<ITabsContext>(() => ({
    state,
    select: handleChange,
  }), [...Object.values(state), handleChange]);

  return (
    <TabsContext.Provider value={value}>
      {children}
    </TabsContext.Provider>
  );
}
