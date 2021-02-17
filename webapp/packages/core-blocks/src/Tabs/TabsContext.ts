/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';
import type { TabStateReturn } from 'reakit/Tab';

import type { IExecutor } from '@cloudbeaver/core-executor';
import type { MetadataMap } from '@cloudbeaver/core-utils';

import type { ITabInfo, TabsContainer } from './TabsContainer';

export interface ITabData<T = Record<string, any>> {
  tabId: string;
  props: T;
}

export interface ITabsContext<T = Record<string, any>> {
  state: TabStateReturn;
  tabsState: MetadataMap<string, any>;
  props: T;
  container?: TabsContainer<T>;
  openExecutor: IExecutor<ITabData<T>>;
  closeExecutor: IExecutor<ITabData<T>>;
  lazy: boolean;
  getTabInfo: (tabId: string) => ITabInfo<T> | undefined;
  open: (tabId: string) => void;
  close: (tabId: string) => void;
}

export const TabsContext = createContext<ITabsContext<any> | undefined>(
  undefined
);
