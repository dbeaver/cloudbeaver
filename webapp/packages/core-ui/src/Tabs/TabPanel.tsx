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

import { FormContext, getComputed, Loader } from '@cloudbeaver/core-blocks';

import { TabContext } from './TabContext';
import type { TabPanelProps } from './TabPanelProps';
import { TabsContext } from './TabsContext';

export const TabPanel: React.FC<TabPanelProps> = observer(function TabPanel({ tabId, children, className, lazy }) {
  const state = useContext(TabsContext);
  const formContext = useContext(FormContext);
  const panelRef = useRef<HTMLDivElement>(null);

  if (!state) {
    throw new Error('Tabs context was not provided');
  }

  const tabContext = useMemo(() => ({ tabId }), [tabId]);
  const selected = getComputed(() => state.state.selectedId === tabId);
  const enabled = getComputed(() => (lazy || state.lazy) && !selected);

  useEffect(() => {
    if (formContext === null) {
      return;
    }

    async function trackValidity(event: Event) {
      if (selected) {
        return;
      }
      
      await state?.open(tabId);
      formContext?.reportValidity();
    }

    panelRef.current?.addEventListener('invalid', trackValidity, true);
    return () => {
      panelRef.current?.removeEventListener('invalid', trackValidity, true);
    };
  }, [formContext, selected, state, tabId]);

  if (enabled) {
    return null;
  }

  if (typeof children === 'function') {
    return (
      <TabContext.Provider value={tabContext}>
        <BaseTabPanel ref={panelRef} {...state.state} tabId={tabId} className={className}>
          <Loader suspense>{(children as (state: TabStateReturn) => React.ReactNode)(state.state)}</Loader>
        </BaseTabPanel>
      </TabContext.Provider>
    );
  }

  return (
    <TabContext.Provider value={tabContext}>
      <BaseTabPanel ref={panelRef} {...state.state} tabId={tabId} className={className}>
        <Loader suspense>{children}</Loader>
      </BaseTabPanel>
    </TabContext.Provider>
  );
});
