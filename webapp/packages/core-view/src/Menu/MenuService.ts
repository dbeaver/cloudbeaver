/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';

import { ActionService } from '../Action/ActionService';
import { isAction } from '../Action/createAction';
import type { IAction } from '../Action/IAction';
import type { IDataContextProvider } from '../DataContext/IDataContextProvider';
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
  private readonly handlers: Map<string, IMenuHandler>;
  private readonly creators: IMenuItemsCreator[];

  constructor(
    private readonly actionService: ActionService,
  ) {
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

  isMenuAvailable(context: IDataContextProvider): boolean {
    return this.creators
      .some(filterApplicable(context));
  }

  addCreator(creator: IMenuItemsCreator): void {
    this.creators.push(creator);
  }

  setHandler(handler: IMenuHandler): void {
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

  getMenu(context: IDataContextProvider): IMenuItem[] {
    const applicableCreators = this.creators.filter(filterApplicable(context));

    return applicableCreators
      .reduce<MenuCreatorItem[]>(
      (items, creator) => {
        if (creator.orderItems) {
          return creator.orderItems(context, items);
        }
        return items;
      },
      applicableCreators
        .reduce<MenuCreatorItem[]>((items, creator) => creator.getItems(context, items), [])
        .filter(item => {
          if (isAction(item)) {
            return this.actionService.getHandler(context, item) !== null;
          }

          return true;
        })
    )
      .map(item => {
        if (isAction(item)) {
          return this.createActionItem(context, item) as IMenuItem;
        }
        if (isMenu(item)) {
          return new MenuSubMenuItem(item) as IMenuItem;
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
        const applicable = creator.menus.some(menu => contexts.find(DATA_CONTEXT_MENU, menu));

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
    } else if (creator.menus || creator.contexts) {
      return false;
    }

    return creator.isApplicable?.(contexts) ?? true;
  };
}
