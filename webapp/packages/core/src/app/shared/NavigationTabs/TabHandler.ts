/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

export type TabHandlerComponent = React.FunctionComponent<{
  tabId: string;
  handlerId: string;
}>

export type TabHandlerEvent = (tabId: string, handlerId: string) => void
export type TabRestoreEvent = (
  tabId: string,
  handlerId: string,
) => Promise<boolean> | boolean

export type TabHandlerFilter = (nodeId: string) => boolean

export type TabHandlerOptions = {
  key: string;
  name: string;
  icon: string;
  navigatorId: string;
  order: number;
  priority: number;
  getTabHandlerComponent: () => TabHandlerComponent;
  /** Executed in Tab rendering pipeline */
  isActive?: TabHandlerFilter;
  onSelect?: TabHandlerEvent;
  onClose?: TabHandlerEvent;
  onRestore?: TabRestoreEvent;
}

export class TabHandler {
  @observable key: string
  @observable name: string
  @observable icon: string
  @observable navigatorId: string
  @observable order: number
  @observable priority: number
  @observable getHandler: () => TabHandlerComponent
  @observable isActive: TabHandlerFilter
  @observable onSelect?: TabHandlerEvent
  @observable onClose?: TabHandlerEvent
  @observable onRestore?: TabRestoreEvent

  constructor(options: TabHandlerOptions) {
    this.key = options.key;
    this.name = options.name;
    this.icon = options.icon;
    this.navigatorId = options.navigatorId;
    this.order = options.order;
    this.priority = options.priority;
    this.getHandler = options.getTabHandlerComponent;
    this.isActive = options.isActive || (() => true);
    this.onSelect = options.onSelect;
    this.onClose = options.onClose;
    this.onRestore = options.onRestore;
  }
}
