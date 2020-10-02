/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { IExtension } from '@cloudbeaver/core-extensions';
import { DynamicStyle } from '@cloudbeaver/core-theming';

import { ITab } from './ITab';

export type TabHandlerTabProps<T = any> = {
  tab: ITab<T>;
  handler: TabHandler<T>;
  onSelect(tabId: string): void;
  onClose?(tabId: string): void;
  style: DynamicStyle | DynamicStyle[];
}
export type TabHandlerTabComponent<T = any> = React.FunctionComponent<TabHandlerTabProps<T>>

export type TabHandlerPanelProps<T = any> = {
  tab: ITab<T>;
  handler: TabHandler<T>;
}
export type TabHandlerPanelComponent<T = any> = React.FunctionComponent<TabHandlerPanelProps<T>>

export type TabHandlerEvent<T = any> = (tab: ITab<T>) => Promise<void> | void
export type TabRestoreEvent<T = any> = (tab: ITab<T>) => Promise<boolean> | boolean

export type TabHandlerOptions<TState = any> = {
  key: string;
  getTabComponent(): TabHandlerTabComponent<TState>;
  getPanelComponent(): TabHandlerPanelComponent<TState>;
  onSelect?: TabHandlerEvent<TState>;
  onClose?: TabHandlerEvent<TState>;
  onRestore?: TabRestoreEvent<TState>;
  extensions?: IExtension<ITab<TState>>[];
}

export class TabHandler<TState = any> {
  key: string
  getTabComponent: () => TabHandlerTabComponent<TState>;
  getPanelComponent: () => TabHandlerPanelComponent<TState>;
  onSelect?: TabHandlerEvent<TState>
  onClose?: TabHandlerEvent<TState>
  onRestore?: TabRestoreEvent<TState>
  extensions?: IExtension<ITab<TState>>[];

  constructor(options: TabHandlerOptions<TState>) {
    this.key = options.key;
    this.getTabComponent = options.getTabComponent;
    this.getPanelComponent = options.getPanelComponent;
    this.onSelect = options.onSelect;
    this.onClose = options.onClose;
    this.onRestore = options.onRestore;
    this.extensions = options.extensions;
  }
}
