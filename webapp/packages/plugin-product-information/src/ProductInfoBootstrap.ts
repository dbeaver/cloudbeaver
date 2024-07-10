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
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { MenuBaseItem, MenuService } from '@cloudbeaver/core-view';
import { TOP_NAV_BAR_SETTINGS_MENU } from '@cloudbeaver/plugin-settings-menu';

const ProductInfoDialog = importLazyComponent(() => import('./ProductInfoDialog').then(m => m.ProductInfoDialog));
const ProductInfoDrawerItem = importLazyComponent(() => import('./ProductInfoDrawerItem').then(m => m.ProductInfoDrawerItem));
const ProductInfoPage = importLazyComponent(() => import('./ProductInfoPage').then(m => m.ProductInfoPage));

@injectable()
export class ProductInfoBootstrap extends Bootstrap {
  static PAGE_NAME = 'product-info';

  constructor(
    private readonly serverConfigResource: ServerConfigResource,
    private readonly commonDialogService: CommonDialogService,
    private readonly menuService: MenuService,
    private readonly administrationItemService: AdministrationItemService,
  ) {
    super();
  }

  register(): void {
    this.menuService.addCreator({
      menus: [TOP_NAV_BAR_SETTINGS_MENU],
      isApplicable: () => !!this.serverConfigResource.data?.productInfo,
      getItems: (context, items) => [
        ...items,
        new MenuBaseItem(
          {
            id: 'productInfo',
            label: 'app_product_info',
            tooltip: 'app_product_info',
          },
          {
            onSelect: () => this.commonDialogService.open(ProductInfoDialog, null),
          },
        ),
      ],
    });

    this.administrationItemService.create({
      name: ProductInfoBootstrap.PAGE_NAME,
      type: AdministrationItemType.Administration,
      getContentComponent: () => ProductInfoPage,
      getDrawerComponent: () => ProductInfoDrawerItem,
      order: 12,
    });
  }
}
