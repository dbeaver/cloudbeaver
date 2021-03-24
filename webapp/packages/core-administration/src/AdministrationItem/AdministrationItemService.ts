/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import type { RouterState } from '@cloudbeaver/core-routing';

import { filterConfigurationWizard } from './filterConfigurationWizard';
import {
  IAdministrationItem, IAdministrationItemOptions, IAdministrationItemSubItem, AdministrationItemType
} from './IAdministrationItem';
import type { IAdministrationItemRoute } from './IAdministrationItemRoute';
import { orderAdministrationItems } from './orderAdministrationItems';

@injectable()
export class AdministrationItemService {
  items: IAdministrationItem[] = [];

  constructor() {
    makeObservable(this, {
      items: observable,
    });
  }

  getUniqueItems(configurationWizard: boolean): IAdministrationItem[] {
    const items: IAdministrationItem[] = [];

    const orderedByPriority = this.items.slice()
      .sort((a, b) => {
        if (a.replace && b.replace) {
          return (b.replace.priority ?? Number.MIN_SAFE_INTEGER) - (a.replace.priority ?? Number.MIN_SAFE_INTEGER);
        }
        return 0;
      })
      .filter(item => !item.replace?.condition || item.replace.condition(configurationWizard));

    let lastItem: IAdministrationItem | null = null;
    for (const item of orderedByPriority) {
      if (lastItem?.name === item.name) {
        continue;
      }
      items.push(item);
      lastItem = item;
    }

    return items;
  }

  getActiveItems(configurationWizard: boolean): IAdministrationItem[] {
    return this.getUniqueItems(configurationWizard).filter(item =>
      filterHiddenAdministrationItem(configurationWizard)(item)
      && filterConfigurationWizard(configurationWizard)(item)
    ).sort(orderAdministrationItems(configurationWizard));
  }

  getDefaultItem(configurationWizard: boolean): string | null {
    const items = this.getActiveItems(configurationWizard);

    if (items.length === 0) {
      return null;
    }

    const onlyActive = items.find(filterOnlyActive(configurationWizard));

    if (onlyActive) {
      return onlyActive.name;
    }

    return items[0].name;
  }

  getAdministrationItemRoute(state: RouterState, configurationMode = false): IAdministrationItemRoute {
    return {
      item: state.params.item || this.getDefaultItem(configurationMode),
      sub: state.params.sub || null,
      param: state.params.param || null,
    };
  }

  getItem(name: string, configurationWizard: boolean): IAdministrationItem | null {
    const item = this.getActiveItems(configurationWizard).find(item => item.name === name);

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

  create(options: IAdministrationItemOptions): void {
    const type = options.type ?? AdministrationItemType.Administration;

    const existedIndex = this.items.findIndex(item => item.name === options.name && (
      item.type === type
      || item.type === AdministrationItemType.Default
      || type === AdministrationItemType.Default
    ));

    if (!options.replace && existedIndex !== -1) {
      throw new Error(`Administration item "${options.name}" already exists in the same visibility scope`);
    }

    const item: IAdministrationItem = {
      ...options,
      type,
      sub: options.sub ?? [],
      order: options.order ?? Number.MAX_SAFE_INTEGER,
    };
    this.items.push(item);
  }

  async activate(
    screen: IAdministrationItemRoute,
    configurationWizard: boolean,
    outside: boolean
  ): Promise<void> {
    if (configurationWizard) {
      const items = this.getActiveItems(configurationWizard);

      for (const item of items) {
        await item.configurationWizardOptions?.onLoad?.();
      }
    }

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

    if (item.canActivate && !(await item.canActivate(configurationWizard, outside))) {
      return false;
    }

    if (screen.sub) {
      const sub = this.getItemSub(item, screen.sub);
      if (sub?.canActivate && !(await sub.canActivate(screen.param, configurationWizard))) {
        return false;
      }
    }

    return true;
  }
}

export function filterHiddenAdministrationItem(configurationWizard: boolean): (item: IAdministrationItem) => boolean {
  return function filterHiddenAdministrationItem(item: IAdministrationItem) {
    if (typeof item.isHidden === 'function') {
      return !item.isHidden(configurationWizard);
    }

    return !item.isHidden;
  };
}

export function filterOnlyActive(configurationWizard: boolean): (item: IAdministrationItem) => boolean {
  return function filterOnlyActive(item: IAdministrationItem) {
    if (typeof item.isOnlyActive === 'function') {
      return item.isOnlyActive(configurationWizard);
    }

    return item.isOnlyActive === true;
  };
}
