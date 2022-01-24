/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { MenuBaseItemIconComponent, IMenuBaseItem, IMenuBaseItemOptions } from './IMenuBaseItem';
import type { IMenuItemEvents } from './IMenuItem';
import { MenuItem } from './MenuItem';

interface IMenuBaseItemPropertyGetters {
  isDisabled?: () => boolean;
  iconComponent?: () => MenuBaseItemIconComponent;
}

export class MenuBaseItem extends MenuItem implements IMenuBaseItem {
  private readonly isDisabled?: () => boolean;

  readonly label: string;
  readonly icon?: string;
  readonly tooltip?: string;
  readonly hidden?: boolean;
  readonly iconComponent?: () => MenuBaseItemIconComponent;

  get disabled(): boolean {
    return this.isDisabled?.() ?? false;
  }

  constructor(
    options: IMenuBaseItemOptions,
    events?: IMenuItemEvents,
    getters?: IMenuBaseItemPropertyGetters,
  ) {
    super(options.id, events);
    this.label = options.label;
    this.icon = options.icon;
    this.tooltip = options.tooltip;
    this.isDisabled = getters?.isDisabled;
    this.iconComponent = getters?.iconComponent;
  }
}
