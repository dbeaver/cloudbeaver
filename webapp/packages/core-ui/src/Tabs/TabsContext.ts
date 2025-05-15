/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createContext } from 'react';
import type { TabStateReturn } from 'reakit';

import type { IDataContext } from '@cloudbeaver/core-data-context';
import type { IExecutor } from '@cloudbeaver/core-executor';
import type { MetadataMap, MetadataValueGetter, schema } from '@cloudbeaver/core-utils';

import type { ITabData, ITabInfo, ITabsContainer } from './TabsContainer/ITabsContainer.js';

export type TabDirection = 'left' | 'right';

export interface ITabsContext<T = Record<string, any>> {
  state: TabStateReturn;
  tabsState: MetadataMap<string, any>;
  props: T;
  container?: ITabsContainer<T>;
  openExecutor: IExecutor<ITabData<T>>;
  closeExecutor: IExecutor<ITabData<T>>;
  lazy: boolean;
  closable: boolean;
  tabList?: string[];
  enabledBaseActions?: boolean;
  context: IDataContext;
  canClose: (tabId: string) => boolean;
  getTabInfo: (tabId: string) => ITabInfo<T> | undefined;
  getTabState: <T>(tabId: string, valueGetter?: MetadataValueGetter<string, T>, schema?: schema.AnyZodObject) => T;
  setTabState: <T>(tabId: string, value: T) => T;
  getLocalState: <T>(tabId: string, valueGetter?: MetadataValueGetter<string, T>, schema?: schema.AnyZodObject) => T;
  open: (tabId: string) => Promise<void>;
  close: (tabId: string) => Promise<void>;
  closeAll: () => Promise<void>;
  closeAllToTheDirection: (tabId: string, direction: TabDirection) => Promise<void>;
  closeOthers: (tabId: string) => Promise<void>;
}

export const TabsContext = createContext<ITabsContext<any> | undefined>(undefined);
