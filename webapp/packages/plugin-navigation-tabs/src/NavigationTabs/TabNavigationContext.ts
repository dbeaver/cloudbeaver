/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';

import type { UserInfoResource } from '@cloudbeaver/core-authentication';
import { uuid } from '@cloudbeaver/core-utils';

import type { ITab, ITabOptions } from './ITab.js';
import type { NavigationTabsService } from './NavigationTabsService.js';

export interface ITabNavigationContext {
  readonly isNewlyCreated: boolean;
  readonly handlerPriority: number;
  readonly tab: ITab | null;
  openNewTab: <T = any>(options: ITabOptions<T>) => ITab<T>;
  registerTab: (tab: ITab) => void;
}

export class TabNavigationContext implements ITabNavigationContext {
  get isNewlyCreated(): boolean {
    return this._isNewlyCreated;
  }

  get handlerPriority(): number {
    return this._handlerPriority;
  }

  get tab(): ITab | null {
    return this._tab;
  }

  private _isNewlyCreated = false;
  private readonly _handlerPriority = 0;
  private _tab: ITab | null = null;

  constructor(private readonly navigationTabsService: NavigationTabsService, private readonly userInfoResource: UserInfoResource) {}

  openNewTab<T = any>(options: ITabOptions<T>): ITab<T> {
    this._tab = observable<ITab<T>>({
      id: uuid(),
      userId: this.userInfoResource.getId(),
      ...options,
    });
    this._isNewlyCreated = true;
    this.navigationTabsService.openTab(this._tab, true);
    return this._tab;
  }

  registerTab(tab: ITab): void {
    this._tab = tab;
  }
}
