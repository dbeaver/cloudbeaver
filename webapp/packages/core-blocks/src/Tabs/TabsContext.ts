/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';
import { TabStateReturn } from 'reakit/Tab';

import { IExecutor } from '@cloudbeaver/core-executor';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { TabsContainer } from './TabsContainer';

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
  open: (tabId: string) => void;
  close: (tabId: string) => void;
}

export const TabsContext = createContext<ITabsContext<any> | undefined>(
  undefined
);
