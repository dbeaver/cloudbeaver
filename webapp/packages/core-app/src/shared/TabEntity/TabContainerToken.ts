/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createValueToken, IServiceInjector } from '@cloudbeaver/core-di';

export interface ITabContainerEntity {
  getTabServiceInjector(tabId: string): IServiceInjector;
  closeTab(tabId: string): void;
  activateTab(tabId: string): void;
}

export const TabContainerToken = createValueToken<ITabContainerEntity>('ITabContainerEntity');
