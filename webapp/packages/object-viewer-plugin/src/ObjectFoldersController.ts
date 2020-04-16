/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { autorun } from 'mobx';
import { IReactionDisposer } from 'mobx/lib/internal';

import {
  NavigationTabsService, Tab,
} from '@dbeaver/core/app';
import { IDestructibleController, IInitializableController, injectable } from '@dbeaver/core/di';

import { ObjectFoldersService } from './ObjectFoldersService';
import { ObjectFoldersTabContainer } from './ObjectFoldersTabsContainer/ObjectFoldersTabContainer';


@injectable()
export class ObjectFoldersController implements IInitializableController, IDestructibleController {

  private tabContainer!: ObjectFoldersTabContainer;
  private objectId!: string;

  private navigationTab!: Tab

  private disposer!: IReactionDisposer;

  constructor(private navigationTabsService: NavigationTabsService,
              private objectFoldersService: ObjectFoldersService) {
  }

  getTabContainer() {
    return this.tabContainer;
  }

  init(objectId: string): void {
    const navigationTab = this.navigationTabsService.getTab(objectId);
    if (!navigationTab) {
      throw new Error(`Tab ${objectId} not found`);
    }
    this.navigationTab = navigationTab;

    this.objectId = objectId;
    this.tabContainer = this.objectFoldersService.createTabsContainer(objectId);

    this.disposer = autorun(() => {
      const currentTabId = this.navigationTab.getHandlerState<string>(this.navigationTab.handlerId) || null;
      this.activateTab(currentTabId);
    });
  }

  activateTab(tabId: string | null) {
    try {
      this.tabContainer.activateTab(tabId);
    } catch {
      // no tab with tabId
      this.activateFirstTab();
    }
  }

  activateFirstTab() {
    const firstTab = this.tabContainer.tabs[0];
    this.tabContainer.activateTab(firstTab?.tabId || null);
  }

  destruct(): void {
    this.disposer();
    this.objectFoldersService.destroyTabContainer(this.objectId);
  }
}
