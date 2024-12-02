/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { type ITabInfo, type ITabInfoOptions, TabsContainer } from '@cloudbeaver/core-ui';

import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel.js';

export interface IDataValuePanelOptions {
  dataFormat: ResultDataFormat[];
}

export interface IDataValuePanelProps {
  dataFormat: ResultDataFormat | null;
  model: IDatabaseDataModel;
  resultIndex: number;
}

@injectable()
export class DataValuePanelService {
  readonly tabs: TabsContainer<IDataValuePanelProps, IDataValuePanelOptions>;

  constructor() {
    this.tabs = new TabsContainer('Value Panel');
  }

  get(tabId: string): ITabInfo<IDataValuePanelProps, IDataValuePanelOptions> | undefined {
    return this.tabs.getTabInfo(tabId);
  }

  getDisplayed(props?: IDataValuePanelProps): Array<ITabInfo<IDataValuePanelProps, IDataValuePanelOptions>> {
    return this.tabs.tabInfoList.filter(
      info =>
        (props?.dataFormat === undefined || props.dataFormat === null || info.options?.dataFormat.includes(props.dataFormat)) &&
        !info.isHidden?.(info.key, props),
    );
  }

  add(tabInfo: ITabInfoOptions<IDataValuePanelProps, IDataValuePanelOptions>): void {
    this.tabs.add(tabInfo);
  }
}
