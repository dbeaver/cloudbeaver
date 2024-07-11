/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { Executor, IExecutor, IExecutorHandler } from '@cloudbeaver/core-executor';
import type { RouterState } from '@cloudbeaver/core-routing';

import { filterConfigurationWizard } from './filterConfigurationWizard';
import { AdministrationItemType, IAdministrationItem, IAdministrationItemOptions, IAdministrationItemSubItem } from './IAdministrationItem';
import type { IAdministrationItemRoute } from './IAdministrationItemRoute';
import { orderAdministrationItems } from './orderAdministrationItems';

interface IActivationData {
  screen: IAdministrationItemRoute;
  configurationWizard: boolean;
  outside: boolean;
  outsideAdminPage: boolean;
}

@injectable()
export class AdministrationItemService {
  items: IAdministrationItem[] = [];

  itemActivating: boolean;
  itemDeactivating: boolean;

  private activationTask: IExecutor<IActivationData>;
  private deActivationTask: IExecutor<IActivationData>;

  constructor() {
    this.itemActivating = false;
    this.itemDeactivating = false;
    this.activationTask = new Executor();
    this.deActivationTask = new Executor();

    makeObservable(this, {
      items: observable,
      itemActivating: observable,
      itemDeactivating: observable,
    });

    this.activationTask
      .addHandler(() => {
        this.itemActivating = true;
      })
      .addHandler(this.activateHandler)
      .addPostHandler(() => {
        this.itemActivating = false;
      });

    this.deActivationTask
      .addHandler(() => {
        this.itemDeactivating = true;
      })
      .addHandler(this.deActivateHandler)
      .addPostHandler(() => {
        this.itemDeactivating = false;
      });
  }

  getUniqueItems(configurationWizard: boolean): IAdministrationItem[] {
    const items: IAdministrationItem[] = [];

    const orderedByPriority = this.items
      .slice()
      .sort((a, b) => {
        if (a.name !== b.name) {
          return a.name.localeCompare(b.name);
        }

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
    return this.getUniqueItems(configurationWizard)
      .filter(item => filterHiddenAdministrationItem(configurationWizard)(item) && filterConfigurationWizard(configurationWizard)(item))
      .sort(orderAdministrationItems(configurationWizard));
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

    const existedIndex = this.items.findIndex(
      item =>
        item.name === options.name && (item.type === type || item.type === AdministrationItemType.Default || type === AdministrationItemType.Default),
    );

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

  updateItem(name: string, partialItem: Partial<IAdministrationItem>, configurationWizard: boolean): void {
    const item = this.getItem(name, configurationWizard);

    if (!item) {
      throw new Error(`Administration item "${name}" not found`);
    }

    Object.assign(item, partialItem);
  }

  updateItemSub(subName: string, partialSub: Partial<IAdministrationItemSubItem>, itemName: string, configurationWizard: boolean): void {
    const item = this.getItem(itemName, configurationWizard);

    if (!item) {
      throw new Error(`Administration item "${itemName}" not found`);
    }

    const sub = this.getItemSub(item, subName);

    if (!sub) {
      throw new Error(`Administration item sub "${subName}" not found`);
    }

    Object.assign(sub, partialSub);
  }

  createItemSub(sub: IAdministrationItemSubItem, itemName: string, configurationWizard: boolean): void {
    const item = this.getItem(itemName, configurationWizard);

    if (!item) {
      // probably your plugin should be registered before the plugin where you want to add sub item
      // (check order in product plugins list)
      throw new Error(`Administration item "${itemName}" not found`);
    }

    const hasSub = this.getItemSub(item, sub.name);

    if (hasSub) {
      throw new Error(`Administration item "${sub.name}" already exists`);
    }

    item.sub.push(sub);
  }

  async activate(screen: IAdministrationItemRoute, configurationWizard: boolean, outside: boolean, outsideAdminPage: boolean): Promise<void> {
    await this.activationTask.execute({ screen, configurationWizard, outside, outsideAdminPage });
  }

  async deActivate(screen: IAdministrationItemRoute, configurationWizard: boolean, outside: boolean, outsideAdminPage: boolean): Promise<void> {
    await this.deActivationTask.execute({ screen, configurationWizard, outside, outsideAdminPage });
  }

  async canDeActivate(
    screen: IAdministrationItemRoute,
    toScreen: IAdministrationItemRoute | null,
    configurationWizard: boolean,
    outside: boolean,
  ): Promise<boolean> {
    const item = this.getItem(screen.item, configurationWizard);
    let nextItem = null;
    if (toScreen) {
      nextItem = this.getItem(toScreen.item, configurationWizard);
    }

    if (!item) {
      return true;
    }

    if (item.canDeActivate && !(await item.canDeActivate(configurationWizard, outside, nextItem))) {
      return false;
    }

    if (screen.sub) {
      const sub = this.getItemSub(item, screen.sub);
      if (sub?.canDeActivate && !(await sub.canDeActivate(screen.param, configurationWizard))) {
        return false;
      }
    }

    return true;
  }

  async canActivate(screen: IAdministrationItemRoute, configurationWizard: boolean, outside: boolean): Promise<boolean> {
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

  private activateHandler: IExecutorHandler<IActivationData> = async ({ screen, configurationWizard, outside, outsideAdminPage }) => {
    let lastItem = 0;
    while (true) {
      const items = this.getActiveItems(configurationWizard);
      if (lastItem === items.length) {
        break;
      }
      await items[lastItem]?.onLoad?.(configurationWizard, outside, outsideAdminPage);
      lastItem++;
    }

    if (configurationWizard) {
      let item = 0;
      while (true) {
        const items = this.getActiveItems(configurationWizard);
        if (item === items.length) {
          break;
        }
        await items[item].configurationWizardOptions?.onLoad?.();
        item++;
      }
    }

    const item = this.getItem(screen.item, configurationWizard);
    if (!item) {
      return;
    }

    await item.onActivate?.(configurationWizard, outside, outsideAdminPage);

    if (screen.sub) {
      await this.getItemSub(item, screen.sub)?.onActivate?.(screen.param, configurationWizard, outside);
    }
  };

  private deActivateHandler: IExecutorHandler<IActivationData> = async ({ screen, configurationWizard, outside, outsideAdminPage }) => {
    const item = this.getItem(screen.item, configurationWizard);
    if (!item) {
      return;
    }

    await item.onDeActivate?.(configurationWizard, outside, outsideAdminPage);

    if (screen.sub) {
      await this.getItemSub(item, screen.sub)?.onDeActivate?.(screen.param, configurationWizard, outside);
    }
  };
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
