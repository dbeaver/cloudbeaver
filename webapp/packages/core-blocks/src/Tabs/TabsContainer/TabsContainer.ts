/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import type { ITabInfo, ITabInfoOptions, ITabsContainer } from './ITabsContainer';

export class TabsContainer<TProps = Record<string, any>, TOptions extends Record<string, any> = never>
implements ITabsContainer<TProps, TOptions> {
  readonly tabInfoMap: Map<string, ITabInfo<TProps, TOptions>>;

  get tabInfoList(): Array<ITabInfo<TProps, TOptions>> {
    return Array.from(this.tabInfoMap.values())
      .sort((a, b) => a.order - b.order);
  }

  constructor() {
    makeObservable(this, {
      tabInfoMap: observable.shallow,
    });

    this.tabInfoMap = new Map();
  }

  getTabInfo(tabId: string): ITabInfo<TProps, TOptions> | undefined {
    return this.tabInfoMap.get(tabId);
  }

  getDisplayed(props?: TProps): Array<ITabInfo<TProps, TOptions>> {
    return this.tabInfoList.filter(tabInfo => !tabInfo.isHidden?.(tabInfo.key, props));
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
