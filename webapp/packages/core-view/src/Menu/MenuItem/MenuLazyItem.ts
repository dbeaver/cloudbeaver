/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IMenuItem } from './IMenuItem.js';
import type { IMenuLazyItem } from './IMenuLazyItem.js';
import { MenuItem } from './MenuItem.js';

export abstract class MenuLazyItem extends MenuItem implements IMenuLazyItem {
  task: Promise<IMenuItem> | null;

  constructor() {
    super();
    this.task = null;
  }

  abstract load: () => Promise<IMenuItem>;
}
