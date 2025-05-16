/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import type { ILoadableState, MetadataMap, MetadataValueGetter, schema } from '@cloudbeaver/core-utils';

import type { TabProps } from '../Tab/TabProps.js';

export interface ITabData<T = void> {
  tabId: string;
  props: T;
}

export type TabContainerTabComponent<TProps = {}> = React.FC<TabProps & TProps>;
export type TabContainerPanelComponent<TProps = {}> = React.FC<{ tabId: string; className?: string } & TProps>;

export interface ITabInfoOptions<TProps = void, TOptions extends Record<string, any> | unknown = unknown> {
  key: string;
  name?: string;
  title?: string;
  icon?: string;
  order?: number;
  options?: TOptions;

  generator?: (tabId: string, props?: TProps) => string[];

  tab?: () => TabContainerTabComponent<TProps> | React.ExoticComponent;
  panel: () => TabContainerPanelComponent<TProps> | React.ExoticComponent;

  stateGetter?: (props: TProps) => MetadataValueGetter<string, any>;
  getLoader?: (context: IDataContextProvider, props?: TProps) => ILoadableState[] | ILoadableState;

  isHidden?: (tabId: string, props?: TProps) => boolean;
  isDisabled?: (tabId: string, props?: TProps) => boolean;

  onClose?: (tab: ITabData<TProps>) => void;
  onOpen?: (tab: ITabData<TProps>) => void;
}

export interface ITabInfo<TProps = void, TOptions extends Record<string, any> | unknown = unknown> extends ITabInfoOptions<TProps, TOptions> {
  order: number;
}

export interface ITabsContainer<TProps = void, TOptions extends Record<string, any> | unknown = unknown> {
  readonly areaLabel: string;
  readonly tabInfoList: Array<ITabInfo<TProps, TOptions>>;
  readonly selectedId: string | null;
  has: (tabId: string) => boolean;
  getTabInfo: (tabId: string) => ITabInfo<TProps, TOptions> | undefined;
  getDisplayedTabInfo: (tabId: string, props?: TProps) => ITabInfo<TProps, TOptions> | undefined;
  getTabState: <T>(
    state: MetadataMap<string, any>,
    tabId: string,
    props: TProps,
    valueGetter?: MetadataValueGetter<string, T>,
    schema?: schema.AnyZodObject,
  ) => T;
  setTabState: <T>(state: MetadataMap<string, any>, tabId: string, value: T) => T;
  getDisplayed: (props?: TProps) => Array<ITabInfo<TProps, TOptions>>;
  getIdList: (props?: TProps) => string[];
}
