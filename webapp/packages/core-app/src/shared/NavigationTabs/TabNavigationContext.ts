/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { uuid } from '@cloudbeaver/core-utils';

import { ITab, ITabOptions } from './ITab';
import { NavigationTabsService } from './NavigationTabsService';

export interface ITabNavigationContext {
  readonly isNewlyCreated: boolean;
  readonly handlerPriority: number;
  readonly tab: ITab | null;
  openNewTab<T = any>(options: ITabOptions<T>): ITab<T>;
  registerTab(tab: ITab): void;
}

export class TabNavigationContext implements ITabNavigationContext {
  get isNewlyCreated() {
    return this._isNewlyCreated;
  }
  get handlerPriority() {
    return this._handlerPriority;
  }
  get tab() {
    return this._tab;
  }
  private _isNewlyCreated = false;
  private _handlerPriority = 0;
  private _tab: ITab | null = null;

  constructor(private navigationTabsService: NavigationTabsService) { }

  openNewTab<T = any>(options: ITabOptions<T>): ITab<T> {
    this._tab = observable({
      id: uuid(),
      restored: true,
      ...options,
    });
    this._isNewlyCreated = true;
    this.navigationTabsService.openTab(this._tab, true);
    return this._tab;
  }

  registerTab(tab: ITab) {
    this._tab = tab;
  }
}
