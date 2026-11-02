/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { DataContextGetter, IDataContextProvider } from '@cloudbeaver/core-data-context';
import type { ILoadableState } from '@cloudbeaver/core-utils';

import type { IAction } from '../Action/IAction.js';
import type { IMenu } from './IMenu.js';
import type { IMenuItem } from './MenuItem/IMenuItem.js';

export type MenuCreatorItem = IMenuItem | IAction | IMenu;

export interface IMenuItemsCreator {
  root?: boolean;
  menus: Set<IMenu>;
  contexts: Set<DataContextGetter<any>>;
  /** Dependencies needed before isApplicable/getItems can decide availability. Must be safe for the declared menu and contexts. */
  getPreparationLoader?: (context: IDataContextProvider) => ILoadableState | ILoadableState[];
  isApplicable?: (context: IDataContextProvider) => boolean;
  getItems: (context: IDataContextProvider, items: MenuCreatorItem[]) => MenuCreatorItem[];
  orderItems?: (context: IDataContextProvider, items: MenuCreatorItem[]) => MenuCreatorItem[];
}

export interface IMenuItemsCreatorOptions extends Omit<IMenuItemsCreator, 'menus' | 'contexts'> {
  menus?: IMenu[];
  contexts?: DataContextGetter<any>[];
}
