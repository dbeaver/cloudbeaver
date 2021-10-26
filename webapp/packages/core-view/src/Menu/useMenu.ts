/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import type { IContext } from '../Context/IContext';
import type { IMenu } from './IMenu';
import { MenuService } from './MenuService';
import { useMenuContext } from './useMenuContext';

interface IMenuHook {
  context: IContext;
}

export function useMenu(menu: IMenu): IMenuHook {
  const menuService = useService(MenuService);
  const [menuContext, context] = useMenuContext(menu);

  return useObjectRef(() => ({
    context,
    isAvailable: () => menuService.isMenuAvailable(menuContext),
    getItems: () => menuService.getMenu(menuContext),
  }), false);
}
