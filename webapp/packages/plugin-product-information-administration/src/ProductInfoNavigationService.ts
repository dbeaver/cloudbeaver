/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AdministrationScreenService, type IRouteParams } from '@cloudbeaver/core-administration';
import { injectable } from '@cloudbeaver/core-di';

@injectable()
export class ProductInfoNavigationService {
  static ROOT_ITEM = 'product-info';

  constructor(private readonly administrationScreenService: AdministrationScreenService) {
    this.navToRoot = this.navToRoot.bind(this);
  }

  navToRoot(): void {
    this.administrationScreenService.navigateToItem(ProductInfoNavigationService.ROOT_ITEM);
  }

  navigateToSub(params: IRouteParams): void {
    this.administrationScreenService.navigateToItemSub(ProductInfoNavigationService.ROOT_ITEM, params.sub, params.param);
  }
}
