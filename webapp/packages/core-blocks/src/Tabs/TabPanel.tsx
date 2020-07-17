/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import {
  useContext, PropsWithChildren,
} from 'react';
import { TabPanel as BaseTabPanel } from 'reakit/Tab';

import { TabsContext } from './TabsContext';

type TabProps = PropsWithChildren<{
  tabId: string;
  className?: string;
}>;

export const TabPanel = observer(function TabPanel({
  tabId,
  children,
  className,
}: TabProps) {
  const state = useContext(TabsContext);

  if (!state) {
    throw new Error('Tabs context was not provided');
  }

  return (
    <BaseTabPanel {...state} tabId={tabId} className={className}>
      {children}
    </BaseTabPanel>
  );
});
