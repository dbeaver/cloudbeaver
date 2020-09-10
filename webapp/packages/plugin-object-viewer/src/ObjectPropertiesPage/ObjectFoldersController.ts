/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { autorun } from 'mobx';

import { ITab, NavigationTabsService } from '@cloudbeaver/core-app';
import { IDestructibleController, IInitializableController, injectable } from '@cloudbeaver/core-di';

import { IObjectViewerTabState } from '../IObjectViewerTabState';
import { ObjectFoldersService } from './ObjectFoldersService';
import { ObjectFoldersTabContainer } from './ObjectFoldersTabsContainer/ObjectFoldersTabContainer';

@injectable()
export class ObjectFoldersController implements IInitializableController, IDestructibleController {

  private tabContainer!: ObjectFoldersTabContainer;
  private navigationTab!: ITab<IObjectViewerTabState>
  private disposer!: ReturnType<typeof autorun>;

  constructor(
    private objectFoldersService: ObjectFoldersService,
    private navigationTabsService: NavigationTabsService
  ) { }

  getTabContainer() {
    return this.tabContainer;
  }

  init(tab: ITab<IObjectViewerTabState>): void {
    this.navigationTab = tab;

    this.tabContainer = this.objectFoldersService.createTabsContainer(tab.handlerState.objectId);

    this.disposer = autorun(() => {
      const currentFolderId = tab.handlerState.folderId || null;
      if (this.navigationTabsService.currentTabId === tab.id) {
        this.activateTab(currentFolderId);
      }
    });
  }

  activateTab(folderId: string | null) {
    try {
      this.tabContainer.activateTab(folderId);
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
    this.objectFoldersService.destroyTabContainer(this.navigationTab.handlerState.objectId);
  }
}
