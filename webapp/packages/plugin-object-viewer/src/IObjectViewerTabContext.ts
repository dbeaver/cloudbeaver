/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ITabNavigationContext, INodeNavigationContext, ITab } from '@cloudbeaver/core-app';

import type { IObjectViewerTabState } from './IObjectViewerTabState';
import type { ObjectPage } from './ObjectPage/ObjectPage';

export interface IObjectViewerTabContext {
  tab: ITab<IObjectViewerTabState> | null;
  page?: ObjectPage<any>;
  tabInfo: ITabNavigationContext;
  nodeInfo: INodeNavigationContext;
  isPageActive: (page: ObjectPage<any>) => boolean;
  canSwitchPage: (page: ObjectPage<any>) => boolean;
  trySwitchPage: <T>(page: ObjectPage<T>, state?: T) => boolean;
  switchPage: <T>(page?: ObjectPage<T>, state?: T) => boolean;
}
