/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { injectable } from '@dbeaver/core/di';

import { IAdministrationItem, IAdministrationItemOptions } from './IAdministrationItem';

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

  create(options: IAdministrationItemOptions) {
    if (this.items.some(item => item.name === options.name)) {
      throw new Error(`Administration item "${options.name}" already exists`);
    }

    const item: IAdministrationItem = {
      ...options,
      order: options.order || Number.MAX_SAFE_INTEGER,
    };
    this.items.push(item);
  }

  async activate(name: string) {
    const item = this.getItem(name);
    if (item && item.onActivate) {
      await item.onActivate();
    }
  }
}
