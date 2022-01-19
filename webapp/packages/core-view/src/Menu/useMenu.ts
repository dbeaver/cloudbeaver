/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import type { IDataContext } from '../DataContext/IDataContext';
import { DATA_CONTEXT_MENU_LOCAL } from './DATA_CONTEXT_MENU_LOCAL';
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

interface IMenuOptions {
  menu: IMenu;
  context?: IDataContext;
  local?: boolean;
}

export function useMenu(options: IMenuOptions): IMenuData {
  const menuService = useService(MenuService);
  const context = useMenuContext(options.menu, options.context);

  context.set(DATA_CONTEXT_MENU_LOCAL, options.local);

  return useObjectRef(() => ({
    isAvailable() {
      return menuService.isMenuAvailable(this.context);
    },
    getItems() {
      return menuService.getMenu(this.context);
    },
  }), {
    menu: options.menu,
    context,
  }, ['isAvailable', 'getItems']);
}
