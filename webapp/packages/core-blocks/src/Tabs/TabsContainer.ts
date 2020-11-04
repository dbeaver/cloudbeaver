/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';

import { TabProps } from './Tab/TabProps';
import { ITabData } from './TabsContext';

export type TabContainerTabComponent<TProps = Record<string, any>> = React.FC<TabProps & TProps>;
export type TabContainerPanelComponent<TProps = Record<string, any>> = React.FC<{ tabId: string } & TProps>;

export interface ITabInfoOptions<TProps = Record<string, any>, TOptions extends Record<string, any> = never> {
  key: string;
  name?: string;
  icon?: string;
  order?: number;
  options?: TOptions;

  tab?: () => TabContainerTabComponent<TProps>;
  panel: () => TabContainerPanelComponent<TProps>;

  isHidden?: (tabId: string, props?: TProps) => boolean;
  isDisabled?: (tabId: string, props?: TProps) => boolean;

  onClose?: (tab: ITabData<TProps>) => void;
  onOpen?: (tab: ITabData<TProps>) => void;
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
    return Array.from(this.tabInfoMap.values())
      .sort((a, b) => a.order - b.order);
  }

  constructor() {
    this.tabInfoMap = new Map();
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
