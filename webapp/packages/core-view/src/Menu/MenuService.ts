/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';

import type { IMenuContext } from './IMenuContext';
import type { IMenuItemsCreator } from './IMenuItemsCreator';
import type { IMenuItem } from './MenuItem/IMenuItem';

@injectable()
export class MenuService {
  private creators: IMenuItemsCreator[];

  constructor() {
    this.creators = [];
  }

  isMenuAvailable(context: IMenuContext): boolean {
    return this.creators.some(filterApplicable(context));
  }

  getMenu(context: IMenuContext): IMenuItem[] {
    return this.creators
      .filter(filterApplicable(context))
      .reduce<IMenuItem[]>((items, creator) => creator.getItems(context, items), []);
  }
}

function filterApplicable(context: IMenuContext): (creator: IMenuItemsCreator) => boolean {
  return (creator: IMenuItemsCreator) => creator.isApplicable?.(context) ?? true;
}
