/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IMenuItemEvents } from './IMenuItem.js';
import type { IMenuRadioItem, IMenuRadioItemOptions } from './IMenuRadioItem.js';
import { MenuItem } from './MenuItem.js';

interface IMenuBaseItemPropertyGetters {
  isDisabled?: () => boolean;
  isChecked?: () => boolean;
}

export class MenuRadioItem extends MenuItem implements IMenuRadioItem {
  private readonly isDisabled?: () => boolean;
  private readonly isChecked?: () => boolean;

  readonly label: string;
  readonly tooltip?: string;
  readonly hidden?: boolean;

  get disabled(): boolean {
    return this.isDisabled?.() ?? false;
  }

  get checked(): boolean {
    return this.isChecked?.() ?? this._checked;
  }

  private readonly _checked: boolean;

  constructor(options: IMenuRadioItemOptions, events?: IMenuItemEvents, getters?: IMenuBaseItemPropertyGetters) {
    super(options.id, events);
    this._checked = options.checked ?? false;
    this.label = options.label;
    this.tooltip = options.tooltip;
    this.isDisabled = getters?.isDisabled;
    this.isChecked = getters?.isChecked;
  }
}
