/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IMenuData } from '@cloudbeaver/core-view';

export function isMenuEmpty(menu: Pick<IMenuData, 'items' | 'loaders'>): boolean {
  const hasVisibleItems = menu.items.some(item => !item.hidden);
  // Keep unloaded or outdated submenus available so opening them can trigger their loaders.
  const canLoadItems = menu.loaders.some(loader => !loader.isLoaded() || loader.isOutdated?.() === true);

  return !hasVisibleItems && !canLoadItems;
}
