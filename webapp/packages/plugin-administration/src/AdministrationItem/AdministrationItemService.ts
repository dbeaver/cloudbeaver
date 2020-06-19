/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';

import { IAdministrationItem, IAdministrationItemOptions, IAdministrationItemSubItem } from './IAdministrationItem';

@injectable()
export class AdministrationItemService {
  @observable items: IAdministrationItem[] = []

  getDefaultItem() {
    if (this.items.length === 0) {
      return null;
    }

    return this.items[0].name;
  }

  getItem(name: string): IAdministrationItem | null {
    const item = this.items.find(item => item.name === name);
    if (!item) {
      return null;
    }

    return item;
  }

  getItemSub(item: IAdministrationItem, subItem: string): IAdministrationItemSubItem | null {
    const sub = item.sub.find(sub => sub.name === subItem);
    if (!sub) {
      return null;
    }

    return sub;
  }

  create(options: IAdministrationItemOptions) {
    if (this.items.some(item => item.name === options.name)) {
      throw new Error(`Administration item "${options.name}" already exists`);
    }

    const item: IAdministrationItem = {
      ...options,
      sub: options.sub || [],
      order: options.order || Number.MAX_SAFE_INTEGER,
    };
    this.items.push(item);
  }

  async activate(name: string, itemSub: string | null, param: string | null) {
    const item = this.getItem(name);
    if (!item) {
      return;
    }

    if (item.onActivate) {
      await item.onActivate();
    }

    if (itemSub) {
      const sub = this.getItemSub(item, itemSub);
      if (sub && sub.onActivate) {
        await sub.onActivate(param);
      }
    }
  }
}
