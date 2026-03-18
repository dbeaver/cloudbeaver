/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { TabPanel as BaseTabPanel } from '@dbeaver/ui-kit';
import { observer } from 'mobx-react-lite';
import { useContext, useMemo } from 'react';

import { getComputed, Loader, s, useS } from '@cloudbeaver/core-blocks';

import { TabContext } from './TabContext.js';
import tabPanelStyles from './TabPanel.module.css';
import type { TabPanelProps } from './TabPanelProps.js';
import { TabsContext } from './TabsContext.js';
import { useTabsValidation } from './useTabsValidation.js';
import { useTabsState } from './useTabsState.js';
import { useTabsStore } from './useTabsStore.js';

export const TabPanel: React.FC<TabPanelProps> = observer(function TabPanel({ tabId, children, contents, className, lazy }) {
  const tabContextState = useContext(TabsContext);
  const styles = useS(tabPanelStyles);

  if (!tabContextState) {
    throw new Error('Tabs context was not provided');
  }

  const panelRef = useTabsValidation(tabId);
  const tabContext = useMemo(() => ({ tabId }), [tabId]);
  const store = useTabsStore();
  const selectedId = useTabsState('selectedId');
  const selected = selectedId === tabId;
  const enabled = getComputed(() => (lazy || tabContextState.lazy) && !selected);

  if (enabled) {
    return null;
  }

  function renderChildren() {
    if (typeof children === 'function') {
      const state = store.getState();
      return children(state);
    }

    return children;
  }

  return (
    <TabContext.Provider value={tabContext}>
      <BaseTabPanel ref={panelRef} tabId={tabId} className={s(styles, { tabPanel: true, contents }, className)}>
        <Loader suspense>{renderChildren()}</Loader>
      </BaseTabPanel>
    </TabContext.Provider>
  );
});
