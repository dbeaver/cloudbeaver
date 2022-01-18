/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IMenu } from '../IMenu';
import type { IMenuSubMenuEvents, IMenuSubMenuItem } from './IMenuSubMenuItem';
import { MenuItem } from './MenuItem';

export class MenuSubMenuItem extends MenuItem implements IMenuSubMenuItem {
  readonly menu: IMenu;
  readonly events?: IMenuSubMenuEvents;
  readonly hidden: boolean;

  constructor(
    menu: IMenu,
    events?: IMenuSubMenuEvents
  ) {
    super(menu.id);
    this.menu = menu;
    this.hidden = false;
    this.events = events;
  }
}
