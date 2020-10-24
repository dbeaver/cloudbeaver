/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { RouterState } from '@cloudbeaver/core-routing';

import { filterConfigurationWizard } from './filterConfigurationWizard';
import {
  IAdministrationItem, IAdministrationItemOptions, IAdministrationItemSubItem, AdministrationItemType
} from './IAdministrationItem';
import { IAdministrationItemRoute } from './IAdministrationItemRoute';
import { orderAdministrationItems } from './orderAdministrationItems';

@injectable()
export class AdministrationItemService {
  @observable items: IAdministrationItem[] = [];

  getDefaultItem(configurationWizard: boolean): string | null {
    const items = this.items.filter(filterConfigurationWizard(configurationWizard));

    if (items.length === 0) {
      return null;
    }

    return items.sort(orderAdministrationItems(configurationWizard))[0].name;
  }

  getAdministrationItemRoute(state: RouterState, configurationMode = false): IAdministrationItemRoute {
    return {
      item: state.params.item || this.getDefaultItem(configurationMode),
      sub: state.params.sub || null,
      param: state.params.param || null,
    };
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

  create(options: IAdministrationItemOptions, replace?: boolean): void {
    const type = options.type ?? AdministrationItemType.Administration;

    const existedIndex = this.items.findIndex(item => item.name === options.name && (
      item.type === type
      || item.type === AdministrationItemType.Default
      || type === AdministrationItemType.Default
    ));

    if (!replace && existedIndex !== -1) {
      throw new Error(`Administration item "${options.name}" already exists in the same visibility scope`);
    }

    const item: IAdministrationItem = {
      ...options,
      type,
      sub: options.sub ?? [],
      order: options.order ?? Number.MAX_SAFE_INTEGER,
    };
    if (replace && existedIndex !== -1) {
      this.items.splice(existedIndex, 1, item);
    } else {
      this.items.push(item);
    }
  }

  async activate(
    screen: IAdministrationItemRoute,
    configurationWizard: boolean,
    outside: boolean
  ): Promise<void> {
    const item = this.getItem(screen.item, configurationWizard);
    if (!item) {
      return;
    }

    await item.onActivate?.(configurationWizard, outside);

    if (screen.sub) {
      await this.getItemSub(item, screen.sub)?.onActivate?.(screen.param, configurationWizard, outside);
    }
  }

  async deActivate(
    screen: IAdministrationItemRoute,
    configurationWizard: boolean,
    outside: boolean
  ): Promise<void> {
    const item = this.getItem(screen.item, configurationWizard);
    if (!item) {
      return;
    }

    await item.onDeActivate?.(configurationWizard, outside);

    if (screen.sub) {
      await this.getItemSub(item, screen.sub)?.onDeActivate?.(screen.param, configurationWizard, outside);
    }
  }

  async canActivate(
    screen: IAdministrationItemRoute,
    configurationWizard: boolean,
    outside: boolean
  ): Promise<boolean> {
    const item = this.getItem(screen.item, configurationWizard);
    if (!item) {
      return false;
    }

    if (item.canActivate && !await item.canActivate(configurationWizard, outside)) {
      return false;
    }

    if (screen.sub) {
      const sub = this.getItemSub(item, screen.sub);
      if (sub?.canActivate && !await sub.canActivate(screen.param, configurationWizard)) {
        return false;
      }
    }

    return true;
  }
}
