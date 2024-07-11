/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import {
  AdministrationItemService,
  AdministrationScreenService,
  IAdministrationItem,
  IAdministrationItemSubItem,
} from '@cloudbeaver/core-administration';
import { injectable } from '@cloudbeaver/core-di';

@injectable()
export class ProductInfoNavigationService {
  static ROOT_ITEM = 'product-info';

  constructor(
    private readonly administrationScreenService: AdministrationScreenService,
    private readonly administrationItemService: AdministrationItemService,
  ) {
    this.navToRoot = this.navToRoot.bind(this);
  }

  navToRoot(): void {
    this.administrationScreenService.navigateToItem(ProductInfoNavigationService.ROOT_ITEM);
  }

  navToSub(sub: string, param?: string): void {
    this.administrationScreenService.navigateToItemSub(ProductInfoNavigationService.ROOT_ITEM, sub, param);
  }

  addToSub(sub: IAdministrationItemSubItem) {
    this.administrationItemService.createItemSub(sub, ProductInfoNavigationService.ROOT_ITEM, this.administrationScreenService.isConfigurationMode);
  }

  updateItem(partialItem: Partial<IAdministrationItem>) {
    this.administrationItemService.updateItem(
      ProductInfoNavigationService.ROOT_ITEM,
      partialItem,
      this.administrationScreenService.isConfigurationMode,
    );
  }

  updateSub(subName: string, partialSub: Partial<IAdministrationItemSubItem>) {
    this.administrationItemService.updateItemSub(
      subName,
      partialSub,
      ProductInfoNavigationService.ROOT_ITEM,
      this.administrationScreenService.isConfigurationMode,
    );
  }
}
