/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { ITab } from '@dbeaver/core/app';
import { Style } from '@dbeaver/core/theming';

import { IObjectViewerTabState } from '../IObjectViewerTabState';

export type ObjectPageTabProps = {
  tab: ITab<IObjectViewerTabState>;
  page: ObjectPage;
  onSelect(): void;
  style: Style[];
}
export type ObjectPageTabComponent = React.FunctionComponent<ObjectPageTabProps>

export type ObjectPagePanelProps = {
  tab: ITab<IObjectViewerTabState>;
  page: ObjectPage;
}
export type ObjectPagePanelComponent = React.FunctionComponent<ObjectPagePanelProps>

export type ObjectPageCallback = (tab: ITab<IObjectViewerTabState>) => Promise<void> | void
export type ObjectPageRestoreCallback = (tab: ITab<IObjectViewerTabState>) => Promise<boolean> | boolean

export interface ObjectPageOptions {
  key: string;
  navigatorId: string;
  priority: number;
  order?: number;
  getTabComponent(): ObjectPageTabComponent;
  getPanelComponent(): ObjectPagePanelComponent;
  onSelect?: ObjectPageCallback;
  onClose?: ObjectPageCallback;
  onRestore?: ObjectPageRestoreCallback;
}

export class ObjectPage {
  key: string;
  navigatorId: string;
  priority: number;
  @observable order?: number;
  getTabComponent: () => ObjectPageTabComponent;
  getPanelComponent: () => ObjectPagePanelComponent;
  onSelect?: ObjectPageCallback;
  onClose?: ObjectPageCallback;
  onRestore?: ObjectPageRestoreCallback;

  constructor(options: ObjectPageOptions) {
    this.key = options.key;
    this.navigatorId = options.navigatorId;
    this.priority = options.priority;
    this.order = options.order;
    this.getTabComponent = options.getTabComponent;
    this.getPanelComponent = options.getPanelComponent;
    this.onSelect = options.onSelect;
    this.onClose = options.onClose;
    this.onRestore = options.onRestore;
  }
}
