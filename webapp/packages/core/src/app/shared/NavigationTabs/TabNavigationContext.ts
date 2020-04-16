/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { NavigationTabsService } from './NavigationTabsService';
import { Tab, TabOptions } from './Tab';
import { TabHandlerOptions } from './TabHandler';

export interface ITabNavigationContext {
  readonly isNewlyCreated: boolean;
  readonly handlerPriority: number;
  trySwitchHandler(handler: TabHandlerOptions): void;
  openNewTab(options: TabOptions): Tab;
}

export class TabNavigationContext implements ITabNavigationContext {
  get isNewlyCreated() {
    return this._isNewlyCreated;
  }
  get handlerPriority() {
    return this._handlerPriority;
  }
  private _isNewlyCreated = false;
  private _handlerPriority = 0;

  constructor(private navigationTabsService: NavigationTabsService) { }

  trySwitchHandler(handler: TabHandlerOptions) {
    if (this.handlerPriority < handler.priority) {
      this._handlerPriority = handler.priority;
      this.navigationTabsService.selectHandler(handler.key);
    }
  }

  openNewTab(options: TabOptions) {
    const newTab = new Tab(options);
    this._isNewlyCreated = true;
    this.navigationTabsService.openTab(newTab, true);
    return newTab;
  }
}
