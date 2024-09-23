/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IActionItem } from '../../Action/IActionItem.js';
import type { IMenuActionItem } from './IMenuActionItem.js';
import { MenuItem } from './MenuItem.js';

export class MenuActionItem extends MenuItem implements IMenuActionItem {
  readonly action: IActionItem;

  get hidden(): boolean {
    return this.action.isHidden();
  }

  get disabled(): boolean {
    return this.action.isDisabled();
  }

  constructor(action: IActionItem) {
    super(action.action.id);
    this.action = action;
  }
}
