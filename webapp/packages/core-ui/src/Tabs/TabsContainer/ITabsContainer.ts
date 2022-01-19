/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { MetadataMap, MetadataValueGetter } from '@cloudbeaver/core-utils';

import type { TabProps } from '../Tab/TabProps';

export interface ITabData<T = void> {
  tabId: string;
  props: T;
}

export type TabContainerTabComponent<TProps = void> = React.FC<TabProps & TProps>;
export type TabContainerPanelComponent<TProps = void> = React.FC<{ tabId: string } & TProps>;

export interface ITabInfoOptions<TProps = void, TOptions extends Record<string, any> = never> {
  key: string;
  name?: string;
  title?: string;
  icon?: string;
  order?: number;
  options?: TOptions;

  generator?: (tabId: string, props?: TProps) => string[];

  tab?: () => TabContainerTabComponent<TProps>;
  panel: () => TabContainerPanelComponent<TProps>;

  stateGetter?: (props: TProps) => MetadataValueGetter<string, any>;

  isHidden?: (tabId: string, props?: TProps) => boolean;
  isDisabled?: (tabId: string, props?: TProps) => boolean;

  onClose?: (tab: ITabData<TProps>) => void;
  onOpen?: (tab: ITabData<TProps>) => void;
}

export interface ITabInfo<
  TProps = void,
  TOptions extends Record<string, any> = never
> extends ITabInfoOptions<TProps, TOptions> {
  order: number;
}

export interface ITabsContainer<TProps = void, TOptions extends Record<string, any> = never> {
  readonly tabInfoList: Array<ITabInfo<TProps, TOptions>>;
  readonly selectedId: string | null;
  has: (tabId: string) => boolean;
  getTabInfo: (tabId: string) => ITabInfo<TProps, TOptions> | undefined;
  getTabState: <T>(
    state: MetadataMap<string, any>,
    tabId: string,
    props: TProps,
    valueGetter?: MetadataValueGetter<string, T>
  ) => T;
  getDisplayed: (props?: TProps) => Array<ITabInfo<TProps, TOptions>>;
}
