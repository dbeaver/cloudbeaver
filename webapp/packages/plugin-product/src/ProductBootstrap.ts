/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { SettingsMenuService } from '@cloudbeaver/core-app';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { ServerConfigResource } from '@cloudbeaver/core-root';

import { ProductInfoDialog } from './ProductInfoDialog';

@injectable()
export class ProductBootstrap extends Bootstrap {
  private productInfoMenuToken = 'productInfoMenu';

  constructor(
    private settingsMenuService: SettingsMenuService,
    private serverConfigResource: ServerConfigResource,
    private commonDialogService: CommonDialogService
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.settingsMenuService.addMenuItem(
      SettingsMenuService.settingsMenuToken,
      {
        id: this.productInfoMenuToken,
        order: 3,
        title: 'app_product_info',
        isHidden: () => !this.serverConfigResource.data?.productInfo,
        onClick: async () => await this.commonDialogService.open(ProductInfoDialog, null),
      }
    );
  }

  load(): void | Promise<void> { }
}
