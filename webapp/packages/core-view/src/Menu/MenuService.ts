/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
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
import type { IMenuHandler } from './IMenuHandler';
import type { IMenuItemsCreator } from './IMenuItemsCreator';
import type { IMenuActionItem } from './MenuItem/IMenuActionItem';
import type { IMenuItem } from './MenuItem/IMenuItem';
import { MenuActionItem } from './MenuItem/MenuActionItem';
import { MenuSubMenuItem } from './MenuItem/MenuSubMenuItem';

@injectable()
export class MenuService {
  private handlers: Map<string, IMenuHandler>;
  private creators: IMenuItemsCreator[];

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
    return this.creators
      .filter(filterApplicable(context))
      .reduce<IMenuItem[]>((items, creator) => creator.getItems(context, items), [])
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

function filterApplicable(context: IDataContextProvider): (creator: IMenuItemsCreator) => boolean {
  return (creator: IMenuItemsCreator) => creator.isApplicable?.(context) ?? true;
}
