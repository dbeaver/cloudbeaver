/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IAction } from '../Action/IAction';
import type { DataContextGetter } from '../DataContext/DataContextGetter';
import type { IDataContextProvider } from '../DataContext/IDataContextProvider';
import type { IMenu } from './IMenu';
import type { IMenuItem } from './MenuItem/IMenuItem';

export type MenuCreatorItem = IMenuItem | IAction | IMenu;

export interface IMenuItemsCreator {
  menus?: IMenu[];
  contexts?: DataContextGetter<any>[];
  isApplicable?: (context: IDataContextProvider) => boolean;
  getItems: (
    context: IDataContextProvider,
    items: MenuCreatorItem[]
  ) => MenuCreatorItem[];
  orderItems?: (
    context: IDataContextProvider,
    items: MenuCreatorItem[]
  ) => MenuCreatorItem[];
}
