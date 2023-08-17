/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IAction } from '../Action/IAction';
import type { MenuCreatorItem } from './IMenuItemsCreator';
import type { IMenuItem } from './MenuItem/IMenuItem';

type MenuItem = IMenuItem | IAction;

export function menuExtractItems(items: MenuCreatorItem[], actions: MenuItem[]): MenuItem[] {
  const list: MenuItem[] = [];

  for (const action of actions) {
    const index = items.indexOf(action);
    if (index > -1) {
      items.splice(index, 1);
      list.push(action);
    }
  }

  return list;
}
