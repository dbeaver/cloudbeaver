/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { MenuCreatorItem } from './IMenuItemsCreator.js';
import type { IMenuItem } from './MenuItem/IMenuItem.js';
import { MenuBaseItem } from './MenuItem/MenuBaseItem.js';
import { MenuActionItem } from './MenuItem/MenuActionItem.js';

export function getMenuCreatorItemLabel(item: MenuCreatorItem): string {
  if ('info' in item) {
    return item.info.label;
  }

  return getMenuItemLabel(item);
}

export function getMenuItemLabel(item: IMenuItem): string {
  if (item instanceof MenuBaseItem) {
    return item.label;
  }

  if (item instanceof MenuActionItem) {
    return item.action.actionInfo.label;
  }

  return item.id;
}
