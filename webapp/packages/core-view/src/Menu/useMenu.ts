/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import type { IDataContext } from '@cloudbeaver/core-data-context';
import { useService } from '@cloudbeaver/core-di';
import { flat, type ILoadableState } from '@cloudbeaver/core-utils';

import type { IMenu } from './IMenu.js';
import type { IMenuHandler } from './IMenuHandler.js';
import type { MenuCreatorItem } from './IMenuItemsCreator.js';
import type { IMenuItem } from './MenuItem/IMenuItem.js';
import { MenuService } from './MenuService.js';
import { useMenuContext } from './useMenuContext.js';
import type { IMenuActionItem } from './MenuItem/IMenuActionItem.js';

export interface IMenuData {
  menu: IMenu;
  handler: IMenuHandler | null;
  context: IDataContext;
  available: boolean;
  loaders: ILoadableState[];
  itemCreators: MenuCreatorItem[];
  items: IMenuItem[];
  filterAction: IMenuActionItem | undefined;
}

interface IMenuOptions {
  menu: IMenu;
  context?: IDataContext;
  filterAction?: IMenuActionItem;
}

export function useMenu(options: IMenuOptions): IMenuData {
  const menuService = useService(MenuService);
  const context = useMenuContext(options.menu, options.context);

  const state = useObservableRef<IMenuData>(
    () => ({
      context,
      get loaders(): ILoadableState[] {
        return [
          ...menuService.getMenuItemLoaders(this.context, this.itemCreators),
          ...flat([this.handler?.getLoader?.(this.context, this.menu)]).filter<ILoadableState>(
            (item => !!item) as (obj: any) => obj is ILoadableState,
          ),
        ];
      },
      get itemCreators() {
        return menuService.getMenuItemCreators(this.context);
      },
      get available() {
        return this.handler?.hideIfEmpty?.(this.context) === false || this.itemCreators.length > 0;
      },
      get items(): IMenuItem[] {
        return menuService.getMenu(this.context, this.itemCreators).filter(item => item !== this.filterAction);
      },
      get handler() {
        return menuService.getHandler(this.context);
      },
    }),
    {
      loaders: computed,
      available: computed,
      itemCreators: computed,
      items: computed,
      handler: computed,
      menu: observable.ref,
      context: observable.ref,
      filterAction: observable.ref,
    },
    {
      menu: options.menu,
      context,
      filterAction: options.filterAction,
    },
  );

  return state;
}
