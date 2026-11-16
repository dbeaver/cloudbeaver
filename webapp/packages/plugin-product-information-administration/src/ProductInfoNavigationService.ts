/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AdministrationScreenService, type IRouteParams } from '@cloudbeaver/core-administration';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

export class ProductInfoNavigationServiceImpl {
  static ROOT_ITEM = 'product-info';

  constructor(private readonly administrationScreenService: AdministrationScreenService) {
    this.navToRoot = this.navToRoot.bind(this);
  }

  navToRoot(): void {
    this.administrationScreenService.navigateToItem(ProductInfoNavigationServiceImpl.ROOT_ITEM);
  }

  navigateToSub(params: IRouteParams): void {
    this.administrationScreenService.navigateToItemSub(ProductInfoNavigationServiceImpl.ROOT_ITEM, params.sub, params.param);
  }
}

export type ProductInfoNavigationService = ProductInfoNavigationServiceImpl;

export class ProductInfoNavigationServiceDI extends Context.Service<ProductInfoNavigationServiceDI, ProductInfoNavigationServiceImpl>()(
  '@cloudbeaver/plugin-product-information-administration/ProductInfoNavigationService#ProductInfoNavigationService',
) {
  static readonly implementation = ProductInfoNavigationServiceImpl;
  static readonly ROOT_ITEM = ProductInfoNavigationServiceImpl.ROOT_ITEM;
  static readonly dependencies = () => [AdministrationScreenService] as const;
  static readonly make: Effect.Effect<ProductInfoNavigationServiceImpl, never, Context.Service.Identifier<typeof AdministrationScreenService>> =
    Effect.gen(function* makeProductInfoNavigationService() {
      const administrationScreenService = yield* AdministrationScreenService;

      return new ProductInfoNavigationServiceImpl(administrationScreenService);
    });
  static readonly layer: Layer.Layer<ProductInfoNavigationServiceDI, never, Context.Service.Identifier<typeof AdministrationScreenService>> =
    Layer.effect(
      this,
      Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
    );
}

export const ProductInfoNavigationService = ProductInfoNavigationServiceDI;
