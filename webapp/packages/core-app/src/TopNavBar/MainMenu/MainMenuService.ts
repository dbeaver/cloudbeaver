/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { IComputedMenuItemOptions, StaticMenu } from '@cloudbeaver/core-dialogs';
import { ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';

export enum EMainMenu {
  'mainMenuConnectionsPanel' = 'mainMenuConnectionsPanel',
  'mainMenuToolsPanel' = 'mainMenuToolsPanel',
}

@injectable()
export class MainMenuService {
  readonly onConnectionClick: ISyncExecutor;

  private menuOptions = new StaticMenu();
  private mainMenuToken = 'mainMenu';

  constructor() {
    this.onConnectionClick = new SyncExecutor();
    this.menuOptions.addRootPanel(this.mainMenuToken);

    const connectionMenu: IComputedMenuItemOptions = {
      id: EMainMenu.mainMenuConnectionsPanel,
      order: 1,
      title: 'app_shared_connectionMenu_connection',
      onClick: () => this.onConnectionClick.execute(),
      isPanel: true,
    };
    this.registerRootItem(connectionMenu);

    const toolsMenu: IComputedMenuItemOptions = {
      id: EMainMenu.mainMenuToolsPanel,
      order: 3,
      title: 'app_shared_toolsMenu_tools',
      isPanel: true,
    };
    this.registerRootItem(toolsMenu);
  }

  getMainMenu() {
    return this.menuOptions.getMenu(this.mainMenuToken).menuItems;
  }

  isEmptyMenuPanel(token: string): boolean {
    return this.menuOptions.getMenu(token).menuItems.length === 0;
  }

  registerMenuItem(panelId: string, options: IComputedMenuItemOptions): void {
    this.menuOptions.addMenuItem(panelId, options);
  }

  registerRootItem(menuItem: IComputedMenuItemOptions): void {
    this.registerMenuItem(this.mainMenuToken, menuItem);
  }
}
