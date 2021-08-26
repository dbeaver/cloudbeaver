/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useContext, useMemo } from 'react';
import { TabPanel as BaseTabPanel, TabStateReturn } from 'reakit/Tab';

import { ErrorBoundary } from '../ErrorBoundary';
import { TabContext } from './TabContext';
import type { TabPanelProps } from './TabPanelProps';
import { TabsContext } from './TabsContext';

export const TabPanel: React.FC<TabPanelProps> = function TabPanel({
  tabId,
  children,
  className,
  lazy,
}) {
  const state = useContext(TabsContext);

  if (!state) {
    throw new Error('Tabs context was not provided');
  }

  const tabContext = useMemo(() => ({ tabId }), [tabId]);

  if ((lazy || state.lazy) && state.state.selectedId !== tabId) {
    return null;
  }

  if (typeof children === 'function') {
    return (
      <ErrorBoundary>
        <TabContext.Provider value={tabContext}>
          <BaseTabPanel {...state.state} tabId={tabId} className={className}>
            {(children as (state: TabStateReturn) => React.ReactNode)(state.state)}
          </BaseTabPanel>
        </TabContext.Provider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <TabContext.Provider value={tabContext}>
        <BaseTabPanel {...state.state} tabId={tabId} className={className}>
          {children}
        </BaseTabPanel>
      </TabContext.Provider>
    </ErrorBoundary>
  );
};
