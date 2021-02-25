/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { MetadataValueGetter } from '@cloudbeaver/core-utils';

import type { TabProps } from '../Tab/TabProps';

export interface ITabData<T = Record<string, any>> {
  tabId: string;
  props: T;
}

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

  stateGetter?: (props: TProps) => MetadataValueGetter<string, any>;

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

export interface ITabsContainer<TProps = Record<string, any>, TOptions extends Record<string, any> = never> {
  tabInfoList: Array<ITabInfo<TProps, TOptions>>;
  getTabInfo: (tabId: string) => ITabInfo<TProps, TOptions> | undefined;
  getDisplayed: (props?: TProps) => Array<ITabInfo<TProps, TOptions>>;
}
