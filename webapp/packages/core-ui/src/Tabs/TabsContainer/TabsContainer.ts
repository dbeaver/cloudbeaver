/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import type { MetadataMap, MetadataValueGetter } from '@cloudbeaver/core-utils';

import type { ITabInfo, ITabInfoOptions, ITabsContainer } from './ITabsContainer';

export class TabsContainer<TProps = void, TOptions extends Record<string, any> = never>
implements ITabsContainer<TProps, TOptions> {
  readonly tabInfoMap: Map<string, ITabInfo<TProps, TOptions>>;

  get tabInfoList(): Array<ITabInfo<TProps, TOptions>> {
    return Array.from(this.tabInfoMap.values())
      .sort((a, b) => a.order - b.order);
  }

  get selectedId(): string | null {
    return this.currentTabId;
  }

  private currentTabId: string | null;

  constructor() {
    this.tabInfoMap = new Map();
    this.currentTabId = null;

    makeObservable<TabsContainer<TProps, TOptions>, 'currentTabId'>(this, {
      tabInfoMap: observable.shallow,
      currentTabId: observable,
    });
  }

  has(tabId: string): boolean {
    return this.tabInfoMap.has(tabId);
  }

  select(tabId: string | null, props: TProps): void {
    if (tabId === null) {
      this.currentTabId = tabId;
      return;
    }

    const info = this.getTabInfo(tabId);

    if (!info) {
      return;
    }

    info.onOpen?.({
      tabId,
      props,
    });

    this.currentTabId = tabId;
  }

  getTabInfo(tabId: string): ITabInfo<TProps, TOptions> | undefined {
    return this.tabInfoMap.get(tabId);
  }

  getTabState<T>(
    state: MetadataMap<string, any>,
    tabId: string,
    props: TProps,
    valueGetter?: MetadataValueGetter<string, T>
  ): T {
    const tabInfo = this.getTabInfo(tabId);

    return state.get(tabId, valueGetter || tabInfo?.stateGetter?.(props));
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
