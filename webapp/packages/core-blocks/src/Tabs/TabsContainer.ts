/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';

import { TabProps } from './Tab/TabProps';

export interface ITabInfoOptions<TProps = Record<string, any>, TOptions extends Record<string, any> = never> {
  key: string;
  name?: string;
  icon?: string;
  order?: number;
  options?: TOptions;

  tab?: () => React.FC<TabProps & TProps>;
  panel: () => React.FC<{ tabId: string } & TProps>;

  onClose?: (tabId: string) => void;
  onOpen?: (tabId: string) => void;
}

export interface ITabInfo<
  TProps = Record<string, any>,
  TOptions extends Record<string, any> = never
> extends ITabInfoOptions<TProps, TOptions> {
  order: number;
}

export class TabsContainer<TProps = Record<string, any>, TOptions extends Record<string, any> = never> {
  @observable.shallow
  readonly tabInfoMap: Map<string, ITabInfo<TProps, TOptions>>;

  @computed get tabInfoList(): Array<ITabInfo<TProps, TOptions>> {
    return Array.from(this.tabInfoMap.values()).sort((a, b) => a.order - b.order);
  }

  constructor() {
    this.tabInfoMap = new Map();
  }

  add(tabInfo: ITabInfoOptions<TProps, TOptions>): void {
    if (this.tabInfoMap.has(tabInfo.key)) {
      throw new Error('Tab with same key already exists');
    }

    this.tabInfoMap.set(tabInfo.key, {
      ...tabInfo,
      order: tabInfo.order ?? Number.MAX_SAFE_INTEGER,
    });
  }
}
