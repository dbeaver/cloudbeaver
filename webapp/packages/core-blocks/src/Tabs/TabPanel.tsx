/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useContext } from 'react';
import { TabPanel as BaseTabPanel, TabStateReturn } from 'reakit/Tab';

import { TabsContext } from './TabsContext';

type TabProps = {
  tabId: string;
  className?: string;
  children?: React.ReactNode | ((state: TabStateReturn) => React.ReactNode);
  lazy?: boolean;
};

export const TabPanel = observer(function TabPanel({
  tabId,
  children,
  className,
  lazy,
}: TabProps) {
  const state = useContext(TabsContext);

  if (!state) {
    throw new Error('Tabs context was not provided');
  }

  if (lazy && state.state.selectedId !== tabId) {
    return null;
  }

  if (typeof children === 'function') {
    return (
      <BaseTabPanel {...state.state} tabId={tabId} className={className}>
        {children(state.state)}
      </BaseTabPanel>
    );
  }

  return (
    <BaseTabPanel {...state.state} tabId={tabId} className={className}>
      {children}
    </BaseTabPanel>
  );
});
