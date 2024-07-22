/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import {
  AdministrationItemContentProps,
  AdministrationItemService,
  AdministrationItemType,
  IAdministrationItem,
  IAdministrationItemOptions,
} from '@cloudbeaver/core-administration';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { ITabInfoOptions, TabsContainer } from '@cloudbeaver/core-ui';

const ProductInfoDrawerItem = importLazyComponent(() => import('./ProductInfoDrawerItem').then(m => m.ProductInfoDrawerItem));
const ProductInfoPage = importLazyComponent(() => import('./ProductInfoPage').then(m => m.ProductInfoPage));

@injectable()
export class ProductInfoService extends Dependency {
  static PAGE_NAME = 'product-info';
  readonly tabsContainer: TabsContainer<AdministrationItemContentProps>;
  private readonly administrationItem: IAdministrationItem;

  constructor(private readonly administrationItemService: AdministrationItemService) {
    super();
    this.tabsContainer = new TabsContainer('Product information administration settings');

    this.administrationItem = this.administrationItemService.create({
      name: ProductInfoService.PAGE_NAME,
      type: AdministrationItemType.Administration,
      getContentComponent: () => ProductInfoPage,
      getDrawerComponent: () => ProductInfoDrawerItem,
      order: 12,
    });
  }

  private modifyIsOnlyActive(isOnlyActive: ((configurationWizard: boolean) => boolean) | boolean) {
    if (this.administrationItem.isOnlyActive === undefined) {
      this.administrationItem.isOnlyActive = isOnlyActive;
      return;
    }

    if (typeof this.administrationItem.isOnlyActive === 'boolean') {
      this.administrationItem.isOnlyActive = isOnlyActive;
      return;
    }

    const oldIsOnlyActive = this.administrationItem.isOnlyActive;

    this.administrationItem.isOnlyActive = configurationWizard =>
      oldIsOnlyActive(configurationWizard) && typeof isOnlyActive === 'function' && isOnlyActive(configurationWizard);
  }

  private modifyFilterOnlyActive(filterOnlyActive: (configurationWizard: boolean, item: IAdministrationItem) => boolean) {
    if (this.administrationItem.filterOnlyActive === undefined) {
      this.administrationItem.filterOnlyActive = filterOnlyActive;
      return;
    }

    const oldFilterOnlyActive = this.administrationItem.filterOnlyActive;

    this.administrationItem.filterOnlyActive = (configurationWizard, item) =>
      oldFilterOnlyActive(configurationWizard, item) && filterOnlyActive(configurationWizard, item);
  }

  modify(item: Partial<IAdministrationItemOptions>) {
    if (item.isOnlyActive !== undefined) {
      this.modifyIsOnlyActive(item.isOnlyActive);
    }

    if (item.filterOnlyActive !== undefined) {
      this.modifyFilterOnlyActive(item.filterOnlyActive);
    }

    Object.assign(this.administrationItem, item);
  }

  addSubItem(subItem: ITabInfoOptions<AdministrationItemContentProps>) {
    this.tabsContainer.add(subItem);
    this.administrationItem.sub = [...this.administrationItem.sub, { name: subItem.key }];
  }
}
