/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ITabInfo, ITabInfoOptions, TabsContainer } from '@cloudbeaver/core-ui';
import { injectable } from '@cloudbeaver/core-di';

@injectable()
export class TextValuePresentationService {
  readonly tabs: TabsContainer;

  constructor() {
    this.tabs = new TabsContainer();
  }

  get(tabId: string): ITabInfo | undefined {
    return this.tabs.getTabInfo(tabId);
  }

  add(tabInfo: ITabInfoOptions): void {
    this.tabs.add(tabInfo);
  }
}
