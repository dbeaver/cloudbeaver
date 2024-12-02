/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import type { ITab } from '@cloudbeaver/plugin-navigation-tabs';

import type { IObjectViewerTabState } from '../IObjectViewerTabState.js';

export interface ObjectPageTabProps<T = unknown> {
  tab: ITab<IObjectViewerTabState>;
  page: ObjectPage<T>;
  onSelect: () => void;
}
export type ObjectPageTabComponent<T = unknown> = React.FunctionComponent<ObjectPageTabProps<T>>;

export interface ObjectPagePanelProps<T = unknown> {
  tab: ITab<IObjectViewerTabState>;
  page: ObjectPage<T>;
}
export type ObjectPagePanelComponent<T = unknown> = React.FunctionComponent<ObjectPagePanelProps<T>>;

export type ObjectPageCloseCallback<T> = (tab: ITab<IObjectViewerTabState>, pageState: T) => Promise<boolean> | boolean;
export type ObjectPageCallback<T> = (tab: ITab<IObjectViewerTabState>, pageState: T) => void;
export type ObjectPageRestoreCallback<T> = (tab: ITab<IObjectViewerTabState>, pageState: T) => Promise<boolean> | boolean;

export interface ObjectPageOptions<T = unknown> {
  key: string;
  priority: number;
  order?: number;
  getTabComponent: () => ObjectPageTabComponent<T>;
  getPanelComponent: () => ObjectPagePanelComponent<T>;
  canClose?: ObjectPageCloseCallback<T>;
  onSelect?: ObjectPageCallback<T>;
  onClose?: ObjectPageCallback<T>;
  onUnload?: ObjectPageCallback<T>;
  onRestore?: ObjectPageRestoreCallback<T>;
}

export class ObjectPage<T = unknown> {
  key: string;
  priority: number;
  order?: number;
  getTabComponent: () => ObjectPageTabComponent<T>;
  getPanelComponent: () => ObjectPagePanelComponent<T>;
  onSelect?: ObjectPageCallback<T>;
  canClose?: ObjectPageCloseCallback<T>;
  onClose?: ObjectPageCallback<T>;
  onUnload?: ObjectPageCallback<T>;
  onRestore?: ObjectPageRestoreCallback<T>;

  constructor(options: ObjectPageOptions<T>) {
    this.key = options.key;
    this.priority = options.priority;
    this.order = options.order;
    this.getTabComponent = options.getTabComponent;
    this.getPanelComponent = options.getPanelComponent;
    this.onSelect = options.onSelect;
    this.canClose = options.canClose;
    this.onClose = options.onClose;
    this.onUnload = options.onUnload;
    this.onRestore = options.onRestore;

    makeObservable(this, {
      order: observable,
    });
  }

  getState(tab: ITab<IObjectViewerTabState>): T | undefined {
    return tab.handlerState.pagesState[this.key];
  }

  setState(tab: ITab<IObjectViewerTabState>, state: T): void {
    tab.handlerState.pagesState[this.key] = state;
  }
}
