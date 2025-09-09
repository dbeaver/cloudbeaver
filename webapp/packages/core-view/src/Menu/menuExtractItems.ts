/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IAction } from '../Action/IAction.js';
import type { MenuCreatorItem } from './IMenuItemsCreator.js';
import type { IMenuItem } from './MenuItem/IMenuItem.js';

export type MenuExtractItem = IMenuItem | IAction | string;

export function menuExtractItems(items: MenuCreatorItem[], actions: MenuExtractItem[]): MenuCreatorItem[] {
  const list: MenuCreatorItem[] = [];

  for (const action of actions) {
    const index = menuFindIndex(items, action);
    if (index > -1) {
      list.push(...items.splice(index, 1));
    }
  }

  return list;
}

export function menuFindIndex(items: MenuCreatorItem[], action: MenuExtractItem): number {
  return typeof action === 'string' ? items.findIndex(item => item.id === action) : items.indexOf(action);
}
