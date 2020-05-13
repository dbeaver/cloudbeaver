/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@dbeaver/core/di';
import { IComputedMenuItemOptions, StaticMenu } from '@dbeaver/core/dialogs';

@injectable()
export class MainRightMenuService {

  static menuToken = 'mainRightMenu';
  private menuOptions = new StaticMenu();

  constructor() {
    this.menuOptions.addRootPanel(MainRightMenuService.menuToken);
  }

  getMenu() {
    return this.menuOptions.getMenu(MainRightMenuService.menuToken).menuItems;
  }

  isEmptyMenuPanel(token: string): boolean {
    return this.menuOptions.getMenu(token).menuItems.length === 0;
  }

  registerMenuItem(panelId: string, options: IComputedMenuItemOptions): void {
    this.menuOptions.addMenuItem(panelId, options);
  }

  registerRootItem(menuItem: IComputedMenuItemOptions): void {
    this.registerMenuItem(MainRightMenuService.menuToken, menuItem);
  }
}
