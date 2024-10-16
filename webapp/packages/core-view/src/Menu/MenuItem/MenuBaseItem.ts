/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IMenuBaseItem, IMenuBaseItemOptions, MenuBaseItemIconComponent } from './IMenuBaseItem.js';
import type { IMenuItemEvents } from './IMenuItem.js';
import { MenuItem } from './MenuItem.js';

interface IMenuBaseItemPropertyGetters<TExtraProps = unknown> {
  getExtraProps?: () => TExtraProps;
  isDisabled?: () => boolean;
  iconComponent?: () => MenuBaseItemIconComponent<TExtraProps>;
}

export class MenuBaseItem<TExtraProps = unknown> extends MenuItem implements IMenuBaseItem<TExtraProps> {
  private readonly isDisabled?: () => boolean;

  readonly label: string;
  readonly icon?: string;
  readonly tooltip?: string;
  readonly hidden?: boolean;
  readonly _disabled?: boolean;
  readonly iconComponent?: () => MenuBaseItemIconComponent<TExtraProps>;
  readonly getExtraProps?: () => TExtraProps;

  get disabled(): boolean {
    return this.isDisabled?.() ?? this._disabled ?? false;
  }

  constructor(options: IMenuBaseItemOptions<TExtraProps>, events?: IMenuItemEvents, getters?: IMenuBaseItemPropertyGetters<TExtraProps>) {
    super(options.id, events);
    this.label = options.label;
    this.icon = options.icon;
    this.tooltip = options.tooltip;
    this._disabled = options.disabled;
    this.isDisabled = getters?.isDisabled;
    this.iconComponent = getters?.iconComponent;
    this.getExtraProps = getters?.getExtraProps;
  }
}
