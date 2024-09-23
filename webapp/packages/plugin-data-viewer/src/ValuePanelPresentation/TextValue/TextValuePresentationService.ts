/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { type ITabInfo, type ITabInfoOptions, TabsContainer } from '@cloudbeaver/core-ui';

import { type IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel.js';
import { ResultSetDataSource } from '../../ResultSet/ResultSetDataSource.js';
import type { IDataValuePanelOptions, IDataValuePanelProps } from '../../TableViewer/ValuePanel/DataValuePanelService.js';

export interface ITextValuePanelProps extends Omit<IDataValuePanelProps, 'model'> {
  model: IDatabaseDataModel<ResultSetDataSource>;
}

@injectable()
export class TextValuePresentationService {
  readonly tabs: TabsContainer<ITextValuePanelProps, IDataValuePanelOptions>;

  constructor() {
    this.tabs = new TabsContainer('Value presentation');
  }

  get(tabId: string): ITabInfo<ITextValuePanelProps, IDataValuePanelOptions> | undefined {
    return this.tabs.getTabInfo(tabId);
  }

  add(tabInfo: ITabInfoOptions<ITextValuePanelProps, IDataValuePanelOptions>): void {
    this.tabs.add(tabInfo);
  }
}
