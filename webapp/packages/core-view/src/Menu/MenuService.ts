/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { injectable } from '@cloudbeaver/core-di';
import { flat, type ILoadableState } from '@cloudbeaver/core-utils';
import { isNotNullDefined } from '@dbeaver/js-helpers';

import { ActionService } from '../Action/ActionService.js';
import { isAction } from '../Action/createAction.js';
import type { IAction } from '../Action/IAction.js';
import { isMenu } from './createMenu.js';
import { DATA_CONTEXT_MENU } from './DATA_CONTEXT_MENU.js';
import { DATA_CONTEXT_MENU_NESTED } from './DATA_CONTEXT_MENU_NESTED.js';
import type { IMenuHandler, IMenuHandlerOptions } from './IMenuHandler.js';
import type { IMenuItemsCreator, IMenuItemsCreatorOptions, MenuCreatorItem } from './IMenuItemsCreator.js';
import type { IMenuActionItem } from './MenuItem/IMenuActionItem.js';
import type { IMenuItem } from './MenuItem/IMenuItem.js';
import { MenuActionItem } from './MenuItem/MenuActionItem.js';
import { MenuSubMenuItem } from './MenuItem/MenuSubMenuItem.js';

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

  addCreator(creator: IMenuItemsCreatorOptions): void {
    this.creators.push({
      ...creator,
      menus: new Set(creator.menus),
      contexts: new Set(creator.contexts),
    });
  }

  setHandler<T = unknown>(handler: IMenuHandlerOptions<T>): void {
    if (this.handlers.has(handler.id)) {
      throw new Error(`Menu handler with same id (${handler.id}) already exists`);
    }
    this.handlers.set(handler.id, {
      ...handler,
      menus: new Set(handler.menus),
      contexts: new Set(handler.contexts),
    });
  }

  getHandler(contexts: IDataContextProvider): IMenuHandler | null {
    const menu = contexts.getOwn(DATA_CONTEXT_MENU);

    handlers: for (const handler of this.handlers.values()) {
      if (handler.menus.size > 0) {
        if (!isNotNullDefined(menu) || !handler.menus.has(menu)) {
          continue;
        }
      }
      for (const context of handler.contexts) {
        if (!contexts.has(context)) {
          continue handlers;
        }
      }
      if (handler.isApplicable?.(contexts) !== false) {
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
          return new MenuSubMenuItem({
            menu: item,
          });
        }
        return item;
      })
      .filter(Boolean);
  }
}

function filterApplicable(contexts: IDataContextProvider): (creator: IMenuItemsCreator) => boolean {
  const menu = contexts.getOwn(DATA_CONTEXT_MENU);

  return (creator: IMenuItemsCreator) => {
    if (creator.root && contexts.has(DATA_CONTEXT_MENU_NESTED)) {
      return false;
    }
    if (creator.menus.size > 0) {
      if (!isNotNullDefined(menu) || !creator.menus.has(menu)) {
        return false;
      }
    }

    if (creator.contexts.size > 0) {
      for (const context of creator.contexts) {
        if (!contexts.has(context)) {
          return false;
        }
      }
    }

    if (creator.isApplicable?.(contexts) === false) {
      return false;
    }

    return true;
  };
}
