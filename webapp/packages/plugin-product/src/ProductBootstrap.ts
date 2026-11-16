/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { ProductInfoResource } from '@cloudbeaver/core-root';
import { MenuBaseItem, MenuService } from '@cloudbeaver/core-view';
import { TOP_NAV_BAR_SETTINGS_MENU } from '@cloudbeaver/plugin-settings-menu';

const ProductInfoDialog = importLazyComponent(() => import('./ProductInfoDialog.js').then(m => m.ProductInfoDialog));

export class ProductBootstrapImpl extends Bootstrap {
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

export type ProductBootstrap = ProductBootstrapImpl;

export class ProductBootstrapDI extends Context.Service<ProductBootstrapDI, ProductBootstrapImpl>()(
  '@cloudbeaver/plugin-product/ProductBootstrap#ProductBootstrap',
) {
  static readonly implementation = ProductBootstrapImpl;

  static readonly dependencies = () => [ProductInfoResource, UserInfoResource, CommonDialogService, MenuService] as const;
  static readonly make: Effect.Effect<
    ProductBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof ProductInfoResource>
    | Context.Service.Identifier<typeof UserInfoResource>
    | Context.Service.Identifier<typeof CommonDialogService>
    | Context.Service.Identifier<typeof MenuService>
  > = Effect.gen(function* makeProductBootstrap() {
    const productInfoResource = yield* ProductInfoResource;
    const userInfoResource = yield* UserInfoResource;
    const commonDialogService = yield* CommonDialogService;
    const menuService = yield* MenuService;

    return new ProductBootstrapImpl(productInfoResource, userInfoResource, commonDialogService, menuService);
  });
  static readonly layer: Layer.Layer<
    ProductBootstrapDI,
    never,
    | Context.Service.Identifier<typeof ProductInfoResource>
    | Context.Service.Identifier<typeof UserInfoResource>
    | Context.Service.Identifier<typeof CommonDialogService>
    | Context.Service.Identifier<typeof MenuService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ProductBootstrap = ProductBootstrapDI;
