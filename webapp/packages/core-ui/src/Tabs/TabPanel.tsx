/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext, useMemo } from 'react';
import { TabPanel as BaseTabPanel } from 'reakit/Tab';

import { getComputed, Loader } from '@cloudbeaver/core-blocks';

import { TabContext } from './TabContext';
import type { TabPanelProps } from './TabPanelProps';
import { TabsContext } from './TabsContext';
import { useTabsValidation } from './useTabsValidation';

export const TabPanel: React.FC<TabPanelProps> = observer(function TabPanel({ tabId, children, className, lazy }) {
  const tabContextState = useContext(TabsContext);

  if (!tabContextState) {
    throw new Error('Tabs context was not provided');
  }

  const panelRef = useTabsValidation(tabId);
  const tabContext = useMemo(() => ({ tabId }), [tabId]);
  const selected = getComputed(() => tabContextState.state.selectedId === tabId);
  const enabled = getComputed(() => (lazy || tabContextState.lazy) && !selected);

  if (enabled) {
    return null;
  }

  function renderChildren() {
    if (typeof children === 'function') {
      return children(tabContextState!.state);
    }

    return children;
  }

  return (
    <TabContext.Provider value={tabContext}>
      <BaseTabPanel ref={panelRef} {...tabContextState.state} tabId={tabId} className={className}>
        <Loader suspense>{renderChildren()}</Loader>
      </BaseTabPanel>
    </TabContext.Provider>
  );
});
