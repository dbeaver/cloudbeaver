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
} from '@cloudbeaver/core-administration';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { ServerLicenseStatusResource } from '@cloudbeaver/core-root';
import { ITabInfoOptions, TabsContainer } from '@cloudbeaver/core-ui';

const ProductInfoDrawerItem = importLazyComponent(() => import('./ProductInfoDrawerItem').then(m => m.ProductInfoDrawerItem));
const ProductInfoPage = importLazyComponent(() => import('./ProductInfoPage').then(m => m.ProductInfoPage));

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
      onActivate: () => {
        this.serverLicenseStatusResource.load();
      },
      order: 12,
    });
  }

  addSubItem(subItem: ITabInfoOptions<AdministrationItemContentProps>) {
    this.tabsContainer.add(subItem);
    this.administrationItem.sub = [...this.administrationItem.sub, { name: subItem.key }];
  }
}
