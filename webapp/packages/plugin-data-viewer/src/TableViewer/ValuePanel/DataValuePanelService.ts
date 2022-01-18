/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ITabInfo, ITabInfoOptions, TabsContainer } from '@cloudbeaver/core-ui';
import { injectable } from '@cloudbeaver/core-di';
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel';
import type { IDatabaseDataResult } from '../../DatabaseDataModel/IDatabaseDataResult';

export interface IDataValuePanelOptions {
  dataFormat: ResultDataFormat[];
}

export interface IDataValuePanelProps<TOptions, TResult extends IDatabaseDataResult = IDatabaseDataResult> {
  dataFormat: ResultDataFormat | null;
  model: IDatabaseDataModel<TOptions, TResult>;
  resultIndex: number;
}

@injectable()
export class DataValuePanelService {
  readonly tabs: TabsContainer<IDataValuePanelProps<any>, IDataValuePanelOptions>;

  constructor() {
    this.tabs = new TabsContainer();
  }

  get(tabId: string): ITabInfo<IDataValuePanelProps<any>, IDataValuePanelOptions> | undefined {
    return this.tabs.getTabInfo(tabId);
  }

  getDisplayed(props?: IDataValuePanelProps<any>): Array<ITabInfo<IDataValuePanelProps<any>, IDataValuePanelOptions>> {
    return this.tabs.tabInfoList.filter(
      info => (
        ((props?.dataFormat === undefined || props.dataFormat === null)
        || info.options?.dataFormat.includes(props.dataFormat))
        && !info.isHidden?.(info.key, props)
      )
    );
  }

  add(tabInfo: ITabInfoOptions<IDataValuePanelProps<any>, IDataValuePanelOptions>): void {
    this.tabs.add(tabInfo);
  }
}
