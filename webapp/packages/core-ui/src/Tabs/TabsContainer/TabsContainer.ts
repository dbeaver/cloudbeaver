/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import type { MetadataMap, MetadataValueGetter, schema } from '@cloudbeaver/core-utils';

import type { ITabInfo, ITabInfoOptions, ITabsContainer } from './ITabsContainer.js';

export class TabsContainer<TProps = void, TOptions extends Record<string, any> | unknown = unknown> implements ITabsContainer<TProps, TOptions> {
  readonly areaLabel: string;
  readonly tabInfoMap: Map<string, ITabInfo<TProps, TOptions>>;

  get tabInfoList(): Array<ITabInfo<TProps, TOptions>> {
    return Array.from(this.tabInfoMap.values()).sort((a, b) => a.order - b.order);
  }

  get selectedId(): string | null {
    return this.currentTabId;
  }

  private currentTabId: string | null;

  constructor(areaLabel: string) {
    this.tabInfoMap = new Map();
    this.currentTabId = null;
    this.areaLabel = areaLabel;

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

    const info = this.getDisplayedTabInfo(tabId, props);

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
    valueGetter?: MetadataValueGetter<string, T>,
    schema?: schema.AnyZodObject,
  ): T {
    const tabInfo = this.getDisplayedTabInfo(tabId, props);

    return state.get(tabId, valueGetter || tabInfo?.stateGetter?.(props), schema);
  }

  setTabState<T>(state: MetadataMap<string, any>, tabId: string, value: T): T {
    return state.set(tabId, value).get(tabId);
  }

  getDisplayed(props?: TProps): Array<ITabInfo<TProps, TOptions>> {
    return this.tabInfoList.filter(tabInfo => !tabInfo.isHidden?.(tabInfo.key, props));
  }

  getDisplayedTabInfo(tabId: string, props?: TProps): ITabInfo<TProps, TOptions> | undefined {
    if (this.tabInfoMap.has(tabId)) {
      return this.getTabInfo(tabId);
    }

    const displayed = this.getDisplayed(props);

    for (const tabInfo of displayed) {
      if (tabInfo.generator) {
        const generated = tabInfo.generator(tabInfo.key, props);

        if (generated.includes(tabId)) {
          return tabInfo;
        }
      } else {
        if (tabInfo.key === tabId) {
          return tabInfo;
        }
      }
    }

    return undefined;
  }

  getIdList(props?: TProps): string[] {
    return this.getDisplayed(props)
      .map(tabInfo => {
        if (tabInfo.generator) {
          return tabInfo.generator(tabInfo.key, props);
        }

        return tabInfo.key;
      })
      .flat();
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
