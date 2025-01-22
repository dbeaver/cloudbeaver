/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import {
  type AdministrationItemContentProps,
  AdministrationItemService,
  AdministrationItemType,
  type IAdministrationItem,
} from '@cloudbeaver/core-administration';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { ServerLicenseStatusResource } from '@cloudbeaver/core-root';
import { type ITabInfoOptions, TabsContainer } from '@cloudbeaver/core-ui';

const ProductInfoDrawerItem = importLazyComponent(() => import('./ProductInfoDrawerItem.js').then(m => m.ProductInfoDrawerItem));
const ProductInfoPage = importLazyComponent(() => import('./ProductInfoPage.js').then(m => m.ProductInfoPage));

@injectable()
export class ProductInfoService extends Dependency {
  static PAGE_NAME = 'product-info';
  readonly tabsContainer: TabsContainer<AdministrationItemContentProps>;
  private readonly administrationItem: IAdministrationItem;

  constructor(
    private readonly administrationItemService: AdministrationItemService,
    private readonly serverLicenseStatusResource: ServerLicenseStatusResource,
  ) {
    super();
    this.tabsContainer = new TabsContainer('Product information administration settings');

    this.administrationItem = this.administrationItemService.create({
      name: ProductInfoService.PAGE_NAME,
      type: AdministrationItemType.Administration,
      getContentComponent: () => ProductInfoPage,
      getDrawerComponent: () => ProductInfoDrawerItem,
      onActivate: async () => {
        await this.serverLicenseStatusResource.load();
      },
      order: 13,
    });
  }

  addSubItem(subItem: ITabInfoOptions<AdministrationItemContentProps>) {
    this.tabsContainer.add(subItem);
    this.administrationItem.sub = [...this.administrationItem.sub, { name: subItem.key }];
  }
}
