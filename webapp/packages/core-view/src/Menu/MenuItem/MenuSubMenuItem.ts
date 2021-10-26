/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IMenu } from '../IMenu';
import type { IMenuSubMenuItem } from './IMenuSubMenuItem';
import { MenuItem } from './MenuItem';

export class MenuSubMenuItem extends MenuItem implements IMenuSubMenuItem {
  readonly menu: IMenu;

  constructor(menu: IMenu) {
    super(menu.id);
    this.menu = menu;
  }
}
