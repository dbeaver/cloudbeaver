/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IMenuItem } from './IMenuItem';
import type { IMenuLazyItem } from './IMenuLazyItem';
import { MenuItem } from './MenuItem';

export abstract class MenuLazyItem extends MenuItem implements IMenuLazyItem {
  task: Promise<IMenuItem> | null;

  constructor() {
    super();
    this.task = null;
  }

  abstract load: () => Promise<IMenuItem>;
}
