/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect, useMemo } from 'react';

import type { IDataContext } from '@cloudbeaver/core-data-context';
import { useService } from '@cloudbeaver/core-di';

import type { IMenu } from './IMenu.js';
import type { IMenuActionItem } from './MenuItem/IMenuActionItem.js';
import { MenuModel } from './MenuModel.js';
import { MenuService } from './MenuService.js';
import { useMenuContext } from './useMenuContext.js';

export type IMenuData = MenuModel;

interface IMenuOptions {
  menu: IMenu;
  context?: IDataContext;
  filterAction?: IMenuActionItem;
}

export function useMenu(options: IMenuOptions): IMenuData {
  const menuService = useService(MenuService);
  const context = useMenuContext(options.menu, options.context);
  const model = useMemo(
    () => new MenuModel(menuService, options.menu, context, options.filterAction),
    [menuService, options.menu, context, options.filterAction],
  );

  useEffect(() => model.start(), [model]);

  return model;
}
