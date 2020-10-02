/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ITabNavigationContext, INodeNavigationContext, ITab } from '@cloudbeaver/core-app';

import { IObjectViewerTabState } from './IObjectViewerTabState';
import { ObjectPage } from './ObjectPage/ObjectPage';

export interface IObjectViewerTabContext {
  tab: ITab<IObjectViewerTabState> | null;
  page?: ObjectPage<any>;
  isPageActive(page: ObjectPage<any>): boolean;
  trySwitchPage<T>(page: ObjectPage<T>, state?: T): boolean;
  tabInfo: ITabNavigationContext;
  nodeInfo: INodeNavigationContext;
}
