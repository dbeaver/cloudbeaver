/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { MenuCreatorItem } from './IMenuItemsCreator.js';
import { menuExtractItems, menuFindIndex, type MenuExtractItem } from './menuExtractItems.js';

export function menuItemsPlaceAfter(items: MenuCreatorItem[], actions: MenuExtractItem[], after: MenuExtractItem): void {
  let anchorItemIndex = menuFindIndex(items, after);

  if (anchorItemIndex !== -1) {
    const extracted = menuExtractItems(items, actions);
    anchorItemIndex = menuFindIndex(items, after);

    if (anchorItemIndex === -1) {
      anchorItemIndex = items.length - 1;
    }

    items.splice(anchorItemIndex + 1, 0, ...extracted);
  }
}
