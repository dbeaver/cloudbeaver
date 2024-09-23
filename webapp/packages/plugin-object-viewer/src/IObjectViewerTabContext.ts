/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { INodeNavigationContext } from '@cloudbeaver/core-navigation-tree';
import type { ITab, ITabNavigationContext } from '@cloudbeaver/plugin-navigation-tabs';

import type { IObjectViewerTabState } from './IObjectViewerTabState.js';
import type { ObjectPage } from './ObjectPage/ObjectPage.js';

export interface IObjectViewerTabContext {
  isSupported: boolean;
  tab: ITab<IObjectViewerTabState> | null;
  page?: ObjectPage<any>;
  tabInfo: ITabNavigationContext;
  nodeInfo: INodeNavigationContext;

  initTab(): Promise<ITab<IObjectViewerTabState> | null>;
  isPageActive: (page: ObjectPage<any>) => boolean;
  canSwitchPage: (page: ObjectPage<any>) => boolean;
  trySwitchPage: <T>(page: ObjectPage<T>, state?: T) => boolean;
  switchPage: <T>(page?: ObjectPage<T>, state?: T) => boolean;
}
