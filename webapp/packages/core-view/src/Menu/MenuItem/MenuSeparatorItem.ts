/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IMenuSeparatorItem } from './IMenuSeparatorItem';
import { MenuItem } from './MenuItem';

export class MenuSeparatorItem extends MenuItem implements IMenuSeparatorItem {
  readonly hidden: boolean;

  constructor(id?: string) {
    super(id);
    this.hidden = false;
  }
}
