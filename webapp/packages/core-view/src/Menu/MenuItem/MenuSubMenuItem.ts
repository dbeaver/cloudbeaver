/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IMenu } from '../IMenu.js';
import type { IMenuSubMenuEvents, IMenuSubMenuItem, IMenuSubMenuItemOptions, MenuSubMenuItemIconComponent } from './IMenuSubMenuItem.js';
import { MenuItem } from './MenuItem.js';

export class MenuSubMenuItem<TExtraProps = unknown> extends MenuItem implements IMenuSubMenuItem<TExtraProps> {
  readonly menu: IMenu;
  readonly label?: string;
  readonly icon?: string;
  readonly tooltip?: string;

  override readonly events?: IMenuSubMenuEvents;
  readonly hidden: boolean;
  readonly getExtraProps?: () => TExtraProps;
  readonly iconComponent?: () => MenuSubMenuItemIconComponent<TExtraProps>;

  constructor(options: IMenuSubMenuItemOptions<TExtraProps>, events?: IMenuSubMenuEvents) {
    super(options.menu.id);
    this.menu = options.menu;
    this.label = options.label;
    this.icon = options.icon;
    this.tooltip = options.tooltip;
    this.getExtraProps = options.getExtraProps;
    this.iconComponent = options.iconComponent;
    this.hidden = false;
    this.events = events;
  }
}
