/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  type TabProviderProps,
  type TabListProps,
  type TabProps,
  type TabStoreState,
  type TabListOptions,
  type TabPanelProps,
  type TabPanelOptions,
  type TabStore,
  Tab as AriakitTab,
  TabList as AriakitTabList,
  TabPanel as AriakitTabPanel,
  TabProvider as AriakitTabProvider,
  useTabStore,
  useTabContext,
  useStoreState,
} from '@ariakit/react';

export function TabProvider({ children, ...props }: TabProviderProps) {
  return <AriakitTabProvider {...props}>{children}</AriakitTabProvider>;
}

export function TabList({ ...props }: TabListProps) {
  return <AriakitTabList {...props} />;
}

export function Tab({ ...props }: TabProps) {
  return <AriakitTab {...props} />;
}

export function TabPanel({ ...props }: TabPanelProps) {
  return <AriakitTabPanel {...props} />;
}

export {
  useTabStore,
  useTabContext,
  useStoreState,
  type TabStoreState,
  type TabListOptions,
  type TabPanelOptions,
  type TabPanelProps,
  type TabProps,
  type TabStore,
};

Tab.TabList = TabList;
Tab.TabPanel = TabPanel;
Tab.Provider = TabProvider;
