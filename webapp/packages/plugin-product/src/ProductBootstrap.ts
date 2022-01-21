/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { DATA_CONTEXT_MENU, MenuBaseItem, MenuService } from '@cloudbeaver/core-view';
import { TOP_NAV_BAR_SETTINGS_MENU } from '@cloudbeaver/plugin-settings-menu';

import { ProductInfoDialog } from './ProductInfoDialog';

@injectable()
export class ProductBootstrap extends Bootstrap {
  constructor(
    private readonly serverConfigResource: ServerConfigResource,
    private readonly commonDialogService: CommonDialogService,
    private readonly menuService: MenuService,
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.menuService.addCreator({
      isApplicable: context => (
        context.get(DATA_CONTEXT_MENU) === TOP_NAV_BAR_SETTINGS_MENU 
        && !!this.serverConfigResource.data?.productInfo
      ),
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
          }
        ),
      ],

    });
  }

  load(): void | Promise<void> { }
}
