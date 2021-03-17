/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import type { ITab } from '@cloudbeaver/core-app';
import type { DynamicStyle } from '@cloudbeaver/core-theming';

import type { IObjectViewerTabState } from '../IObjectViewerTabState';

export interface ObjectPageTabProps<T = unknown> {
  tab: ITab<IObjectViewerTabState>;
  page: ObjectPage<T>;
  onSelect: () => void;
  style: DynamicStyle | DynamicStyle[];
}
export type ObjectPageTabComponent<T> = React.FunctionComponent<ObjectPageTabProps<T>>;

export interface ObjectPagePanelProps<T = unknown> {
  tab: ITab<IObjectViewerTabState>;
  page: ObjectPage<T>;
}
export type ObjectPagePanelComponent<T> = React.FunctionComponent<ObjectPagePanelProps<T>>;

export type ObjectPageCallback<T> = (tab: ITab<IObjectViewerTabState>, pageState: T) => Promise<void> | void;
export type ObjectPageRestoreCallback<T> = (
  tab: ITab<IObjectViewerTabState>,
  pageState: T
) => Promise<boolean> | boolean;

export interface ObjectPageOptions<T = unknown> {
  key: string;
  priority: number;
  order?: number;
  getTabComponent: () => ObjectPageTabComponent<T>;
  getPanelComponent: () => ObjectPagePanelComponent<T>;
  onSelect?: ObjectPageCallback<T>;
  onClose?: ObjectPageCallback<T>;
  onRestore?: ObjectPageRestoreCallback<T>;
}

export class ObjectPage<T = unknown> {
  key: string;
  priority: number;
  order?: number;
  getTabComponent: () => ObjectPageTabComponent<T>;
  getPanelComponent: () => ObjectPagePanelComponent<T>;
  onSelect?: ObjectPageCallback<T>;
  onClose?: ObjectPageCallback<T>;
  onRestore?: ObjectPageRestoreCallback<T>;

  constructor(options: ObjectPageOptions<T>) {
    makeObservable(this, {
      order: observable,
    });

    this.key = options.key;
    this.priority = options.priority;
    this.order = options.order;
    this.getTabComponent = options.getTabComponent;
    this.getPanelComponent = options.getPanelComponent;
    this.onSelect = options.onSelect;
    this.onClose = options.onClose;
    this.onRestore = options.onRestore;
  }

  getState(tab: ITab<IObjectViewerTabState>): T | undefined {
    return tab.handlerState.pagesState[this.key];
  }

  setState(tab: ITab<IObjectViewerTabState>, state: T): void {
    tab.handlerState.pagesState[this.key] = state;
  }
}
