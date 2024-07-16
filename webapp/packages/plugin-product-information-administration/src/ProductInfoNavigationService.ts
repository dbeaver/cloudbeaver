/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AdministrationItemService, AdministrationScreenService } from '@cloudbeaver/core-administration';
import { injectable } from '@cloudbeaver/core-di';

import { ProductInfoService } from './ProductInfoService';

@injectable()
export class ProductInfoNavigationService {
  static ROOT_ITEM = 'product-info';

  constructor(
    private readonly administrationScreenService: AdministrationScreenService,
    private readonly administrationItemService: AdministrationItemService,
    private readonly productInfoService: ProductInfoService,
  ) {
    this.navToRoot = this.navToRoot.bind(this);
  }

  navToRoot(): void {
    this.administrationScreenService.navigateToItem(ProductInfoNavigationService.ROOT_ITEM);
  }

  navToTab(tabId: string | null): void {
    if (this.productInfoService.tabsContainer.selectedId === tabId || !tabId) {
      return;
    }

    const item = this.administrationItemService.getItem(ProductInfoNavigationService.ROOT_ITEM, this.administrationScreenService.isConfigurationMode);

    if (!item) {
      throw new Error('This tab does not exits');
    }

    this.navToRoot();
    this.productInfoService.tabsContainer.select(tabId, {
      item,
      configurationWizard: this.administrationScreenService.isConfigurationMode,
    });
    this.administrationScreenService.navigateToItemSub(ProductInfoNavigationService.ROOT_ITEM, tabId);
  }
}
