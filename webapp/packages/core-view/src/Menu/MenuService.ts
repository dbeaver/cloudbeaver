/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { injectable } from '@cloudbeaver/core-di';
import { flat, ILoadableState } from '@cloudbeaver/core-utils';

import { ActionService } from '../Action/ActionService';
import { isAction } from '../Action/createAction';
import type { IAction } from '../Action/IAction';
import { isMenu } from './createMenu';
import { DATA_CONTEXT_MENU } from './DATA_CONTEXT_MENU';
import { DATA_CONTEXT_MENU_LOCAL } from './DATA_CONTEXT_MENU_LOCAL';
import type { IMenuHandler } from './IMenuHandler';
import type { IMenuItemsCreator, MenuCreatorItem } from './IMenuItemsCreator';
import type { IMenuActionItem } from './MenuItem/IMenuActionItem';
import type { IMenuItem } from './MenuItem/IMenuItem';
import { MenuActionItem } from './MenuItem/MenuActionItem';
import { MenuSubMenuItem } from './MenuItem/MenuSubMenuItem';

@injectable()
export class MenuService {
  private readonly handlers: Map<string, IMenuHandler<any>>;
  private readonly creators: IMenuItemsCreator[];

  constructor(private readonly actionService: ActionService) {
    this.creators = [];
    this.handlers = new Map();
  }

  createActionItem(context: IDataContextProvider, action: IAction): IMenuActionItem | null {
    const actionItem = this.actionService.getAction(context, action);

    if (actionItem) {
      return new MenuActionItem(actionItem);
    }

    return null;
  }

  addCreator(creator: IMenuItemsCreator): void {
    this.creators.push(creator);
  }

  setHandler<T = unknown>(handler: IMenuHandler<T>): void {
    if (this.handlers.has(handler.id)) {
      throw new Error(`Menu handler with same id (${handler.id}) already exists`);
    }
    this.handlers.set(handler.id, handler);
  }

  getHandler(context: IDataContextProvider): IMenuHandler | null {
    for (const handler of this.handlers.values()) {
      if (handler.isApplicable(context)) {
        return handler;
      }
    }

    return null;
  }

  getMenuItemLoaders(context: IDataContextProvider, itemCreators: MenuCreatorItem[]): ILoadableState[] {
    return flat(
      itemCreators.map(item => {
        if (isAction(item)) {
          const handler = this.actionService.getHandler(context, item);

          return handler?.getLoader?.(context, item) ?? null;
        }

        return null;
      }),
    ).filter<ILoadableState>((item => item !== null) as (obj: any) => obj is ILoadableState);
  }

  getMenuItemCreators(context: IDataContextProvider): MenuCreatorItem[] {
    const creators = this.creators.filter(filterApplicable(context));

    return creators.reduce<MenuCreatorItem[]>(
      (items, creator) => {
        if (creator.orderItems) {
          return creator.orderItems(context, [...items]).filter(item => {
            if (isAction(item)) {
              return items.includes(item);
            }
            return true;
          });
        }
        return items;
      },
      creators
        .reduce<MenuCreatorItem[]>((items, creator) => creator.getItems(context, items), [])
        .filter(item => {
          if (isAction(item)) {
            return this.actionService.getHandler(context, item) !== null;
          }

          return true;
        }),
    );
  }

  getMenu(context: IDataContextProvider, itemCreators: MenuCreatorItem[]): IMenuItem[] {
    return itemCreators
      .map(item => {
        if (isAction(item)) {
          return this.createActionItem(context, item) as IMenuItem;
        }
        if (isMenu(item)) {
          return new MenuSubMenuItem({ menu: item }) as IMenuItem;
        }
        return item;
      })
      .filter(Boolean);
  }
}

function filterApplicable(contexts: IDataContextProvider): (creator: IMenuItemsCreator) => boolean {
  const local = contexts.get(DATA_CONTEXT_MENU_LOCAL);

  return (creator: IMenuItemsCreator) => {
    if (local) {
      if (!creator.menus && !creator.contexts) {
        return false;
      }

      if (creator.menus) {
        const applicable = creator.menus.some(menu => contexts.hasValue(DATA_CONTEXT_MENU, menu, false));

        if (!applicable) {
          return false;
        }
      }

      if (creator.contexts) {
        const applicable = creator.contexts.some(context => contexts.has(context));

        if (!applicable) {
          return false;
        }
      }
    } else if (creator.contexts) {
      return false;
    }

    if (creator.isApplicable?.(contexts) === false) {
      return false;
    }

    if (creator.menus) {
      const applicable = creator.menus.some(menu => contexts.hasValue(DATA_CONTEXT_MENU, menu, false));

      if (!applicable) {
        return false;
      }
    }

    return true;
  };
}
