/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IMenuSeparatorItem } from './IMenuSeparatorItem.js';
import { MenuItem } from './MenuItem.js';

export class MenuSeparatorItem extends MenuItem implements IMenuSeparatorItem {
  readonly hidden: boolean;

  constructor(id?: string) {
    super(id);
    this.hidden = false;
  }
}
