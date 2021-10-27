/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import type { IDataContext } from '../DataContext/IDataContext';
import type { IMenu } from './IMenu';
import type { IMenuItem } from './MenuItem/IMenuItem';
import { MenuService } from './MenuService';
import { useMenuContext } from './useMenuContext';

export interface IMenuData {
  menu: IMenu;
  context: IDataContext;
  isAvailable: () => boolean;
  getItems: () => IMenuItem[];
}

export function useMenu(menu: IMenu, menuContext?: IDataContext): IMenuData {
  const menuService = useService(MenuService);
  const context = useMenuContext(menu, menuContext);

  return useObjectRef(() => ({
    isAvailable() {
      return menuService.isMenuAvailable(this.context);
    },
    getItems() {
      return menuService.getMenu(this.context);
    },
  }), {
    menu,
    context,
  }, ['isAvailable', 'getItems']);
}
