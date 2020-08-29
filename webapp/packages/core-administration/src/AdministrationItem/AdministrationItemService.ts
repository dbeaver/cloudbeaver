/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';

import { filterConfigurationWizard } from './filterConfigurationWizard';
import {
  IAdministrationItem, IAdministrationItemOptions, IAdministrationItemSubItem, AdministrationItemType
} from './IAdministrationItem';
import { orderAdministrationItems } from './orderAdministrationItems';

@injectable()
export class AdministrationItemService {
  @observable items: IAdministrationItem[] = []

  getDefaultItem(configurationWizard: boolean) {
    const items = this.items.filter(filterConfigurationWizard(configurationWizard));

    if (items.length === 0) {
      return null;
    }

    return items.sort(orderAdministrationItems)[0].name;
  }

  getItem(name: string, configurationWizard: boolean): IAdministrationItem | null {
    const item = this.items.find(item => (
      filterConfigurationWizard(configurationWizard)(item)
      && item.name === name
    ));
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
    const type = options.type ?? AdministrationItemType.Administration;

    if (this.items.some(item => item.name === options.name && (
      item.type === type
      || item.type === AdministrationItemType.Default
      || type === AdministrationItemType.Default
    ))) {
      throw new Error(`Administration item "${options.name}" already exists in the same visibility scope`);
    }

    const item: IAdministrationItem = {
      ...options,
      type,
      sub: options.sub || [],
      order: options.order || Number.MAX_SAFE_INTEGER,
    };
    this.items.push(item);
  }

  async activate(name: string, itemSub: string | null, param: string | null, configurationWizard: boolean) {
    const item = this.getItem(name, configurationWizard);
    if (!item) {
      return;
    }

    if (item.onActivate) {
      await item.onActivate(configurationWizard);
    }

    if (itemSub) {
      const sub = this.getItemSub(item, itemSub);
      if (sub && sub.onActivate) {
        await sub.onActivate(param, configurationWizard);
      }
    }
  }

  async canActivate(name: string, itemSub: string | null, param: string | null, configurationWizard: boolean) {
    const item = this.getItem(name, configurationWizard);
    if (!item) {
      return false;
    }

    if (item.canActivate && !await item.canActivate(configurationWizard)) {
      return false;
    }

    if (itemSub) {
      const sub = this.getItemSub(item, itemSub);
      if (sub?.canActivate && !await sub.canActivate(param, configurationWizard)) {
        return false;
      }
    }

    return true;
  }
}
