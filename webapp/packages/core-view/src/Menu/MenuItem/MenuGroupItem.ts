/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IMenuGroupItem } from './IMenuGroupItem';
import type { IMenuItem } from './IMenuItem';
import { MenuItem } from './MenuItem';

export class MenuGroupItem extends MenuItem implements IMenuGroupItem {
  items: IMenuItem[];

  constructor(items: IMenuItem[] = []) {
    super();
    this.items = items;
  }

  add(...items: IMenuItem[]): void {
    this.items.push(...items);
  }

  addAfter(index: number, ...items: IMenuItem[]): void {
    this.items.splice(index, 0, ...items);
  }
}
