/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AdministrationItemService, AdministrationItemType } from '@cloudbeaver/core-administration';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

const ProductInfoDrawerItem = importLazyComponent(() => import('./ProductInfoDrawerItem').then(m => m.ProductInfoDrawerItem));
const ProductInfoPage = importLazyComponent(() => import('./ProductInfoPage').then(m => m.ProductInfoPage));

@injectable()
export class ProductInfoBootstrap extends Bootstrap {
  static PAGE_NAME = 'product-info';

  constructor(private readonly administrationItemService: AdministrationItemService) {
    super();
  }

  register(): void {
    this.administrationItemService.create({
      name: ProductInfoBootstrap.PAGE_NAME,
      type: AdministrationItemType.Administration,
      getContentComponent: () => ProductInfoPage,
      getDrawerComponent: () => ProductInfoDrawerItem,
      order: 12,
    });
  }
}
