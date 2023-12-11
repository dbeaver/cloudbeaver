/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext, useEffect, useMemo, useRef } from 'react';
import { TabPanel as BaseTabPanel, TabStateReturn } from 'reakit/Tab';

import { getComputed, Loader } from '@cloudbeaver/core-blocks';

import { TabContext } from './TabContext';
import type { TabPanelProps } from './TabPanelProps';
import { TabsContext } from './TabsContext';
import { TabPanelValidationHandlerContext } from './TabPanelValidationHandlerContext';

export const TabPanel: React.FC<TabPanelProps> = observer(function TabPanel({ tabId, children, className, lazy }) {
  const tabContextState = useContext(TabsContext);
  const panelRef = useRef<HTMLDivElement>(null);
  const tabPanelValidationHandlerContext = useContext(TabPanelValidationHandlerContext);

  if (!tabContextState) {
    throw new Error('Tabs context was not provided');
  }

  const tabContext = useMemo(() => ({ tabId }), [tabId]);
  const selected = getComputed(() => tabContextState.state.selectedId === tabId);
  const enabled = getComputed(() => (lazy || tabContextState.lazy) && !selected);

  async function trackValidity(event: Event) {
    tabPanelValidationHandlerContext?.validate(tabId);
  }

  useEffect(() => {
    if (tabPanelValidationHandlerContext === null) {
      return;
    }

    panelRef.current?.addEventListener('invalid', trackValidity, true);
    return () => {
      panelRef.current?.removeEventListener('invalid', trackValidity, true);
    };
  }, []);

  if (enabled) {
    return null;
  }

  if (typeof children === 'function') {
    return (
      <TabContext.Provider value={tabContext}>
        <BaseTabPanel ref={panelRef} {...tabContextState.state} tabId={tabId} className={className}>
          <Loader suspense>{(children as (state: TabStateReturn) => React.ReactNode)(tabContextState.state)}</Loader>
        </BaseTabPanel>
      </TabContext.Provider>
    );
  }

  return (
    <TabContext.Provider value={tabContext}>
      <BaseTabPanel ref={panelRef} {...tabContextState.state} tabId={tabId} className={className}>
        <Loader suspense>{children}</Loader>
      </BaseTabPanel>
    </TabContext.Provider>
  );
});
