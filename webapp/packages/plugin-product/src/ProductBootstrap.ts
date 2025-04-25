/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { ProductInfoResource } from '@cloudbeaver/core-root';
import { MenuBaseItem, MenuService } from '@cloudbeaver/core-view';
import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { TOP_NAV_BAR_SETTINGS_MENU } from '@cloudbeaver/plugin-settings-menu';

const ProductInfoDialog = importLazyComponent(() => import('./ProductInfoDialog.js').then(m => m.ProductInfoDialog));

@injectable()
export class ProductBootstrap extends Bootstrap {
  constructor(
    private readonly productInfoResource: ProductInfoResource,
    private readonly userInfoResource: UserInfoResource,
    private readonly commonDialogService: CommonDialogService,
    private readonly menuService: MenuService,
  ) {
    super();
  }

  override register(): void {
    this.menuService.addCreator({
      menus: [TOP_NAV_BAR_SETTINGS_MENU],
      isApplicable: () => !this.userInfoResource.isAnonymous() && !!this.productInfoResource.data,
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
  }
}
