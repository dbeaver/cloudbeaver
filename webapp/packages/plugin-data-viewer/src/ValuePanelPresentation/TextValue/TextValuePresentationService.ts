/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { ITabInfo, ITabInfoOptions, TabsContainer } from '@cloudbeaver/core-ui';

import type { IDataValuePanelOptions, IDataValuePanelProps } from '../../TableViewer/ValuePanel/DataValuePanelService';

@injectable()
export class TextValuePresentationService {
  readonly tabs: TabsContainer<IDataValuePanelProps<any>, IDataValuePanelOptions>;

  constructor() {
    this.tabs = new TabsContainer('Value presentation');
  }

  get(tabId: string): ITabInfo<IDataValuePanelProps<any>, IDataValuePanelOptions> | undefined {
    return this.tabs.getTabInfo(tabId);
  }

  add(tabInfo: ITabInfoOptions<IDataValuePanelProps<any>, IDataValuePanelOptions>): void {
    this.tabs.add(tabInfo);
  }
}
