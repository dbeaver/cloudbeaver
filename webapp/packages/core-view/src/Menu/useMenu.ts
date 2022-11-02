/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { flat, ILoadableState } from '@cloudbeaver/core-utils';

import type { IDataContext } from '../DataContext/IDataContext';
import { DATA_CONTEXT_MENU_LOCAL } from './DATA_CONTEXT_MENU_LOCAL';
import type { IMenu } from './IMenu';
import type { IMenuHandler } from './IMenuHandler';
import type { MenuCreatorItem } from './IMenuItemsCreator';
import type { IMenuItem } from './MenuItem/IMenuItem';
import { MenuService } from './MenuService';
import { useMenuContext } from './useMenuContext';

export interface IMenuData {
  menu: IMenu;
  handler: IMenuHandler | null;
  context: IDataContext;
  available: boolean;
  loaders: ILoadableState[];
  itemCreators: MenuCreatorItem[];
  items: IMenuItem[];
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

  const state = useObservableRef<IMenuData>(() => ({
    context,
    get loaders(): ILoadableState[] {
      return [
        ...menuService.getMenuItemLoaders(this.context, this.itemCreators),
        ...flat([this.handler?.getLoader?.(this.context, this.menu)])
          .filter<ILoadableState>((item => !!item) as ((obj: any) => obj is ILoadableState)),
      ];
    },
    get itemCreators() {
      return menuService.getMenuItemCreators(this.context);
    },
    get available() {
      return this.itemCreators.length > 0;
    },
    get items() {
      return menuService.getMenu(this.context, this.itemCreators);
    },
    get handler() {
      return menuService.getHandler(this.context);
    },
  }), {
    loaders: computed,
    available: computed,
    itemCreators: computed,
    items: computed,
    handler: computed,
    menu: observable.ref,
    context: observable.ref,
  }, {
    menu: options.menu,
    context,
  });

  return state;
}
