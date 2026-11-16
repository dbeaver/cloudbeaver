/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import {
  type AdministrationItemContentProps,
  AdministrationItemService,
  AdministrationItemType,
  type IAdministrationItem,
} from '@cloudbeaver/core-administration';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ServerLicenseStatusResource } from '@cloudbeaver/core-root';
import { type ITabInfoOptions, TabsContainer } from '@cloudbeaver/core-ui';

const ProductInfoDrawerItem = importLazyComponent(() => import('./ProductInfoDrawerItem.js').then(m => m.ProductInfoDrawerItem));
const ProductInfoPage = importLazyComponent(() => import('./ProductInfoPage.js').then(m => m.ProductInfoPage));

export class ProductInfoServiceImpl {
  static PAGE_NAME = 'product-info';
  readonly tabsContainer: TabsContainer<AdministrationItemContentProps>;
  private readonly administrationItem: IAdministrationItem;

  constructor(
    private readonly administrationItemService: AdministrationItemService,
    private readonly serverLicenseStatusResource: ServerLicenseStatusResource,
  ) {
    this.tabsContainer = new TabsContainer('Product information administration settings');

    this.administrationItem = this.administrationItemService.create({
      name: ProductInfoServiceImpl.PAGE_NAME,
      type: AdministrationItemType.Administration,
      getContentComponent: () => ProductInfoPage,
      getDrawerComponent: () => ProductInfoDrawerItem,
      onActivate: async () => {
        await this.serverLicenseStatusResource.load();
      },
      order: 13,
    });
  }

  addSubItem(subItem: ITabInfoOptions<AdministrationItemContentProps>) {
    this.tabsContainer.add(subItem);
    this.administrationItem.sub = [...this.administrationItem.sub, { name: subItem.key }];
  }
}

export type ProductInfoService = ProductInfoServiceImpl;

export class ProductInfoServiceDI extends Context.Service<ProductInfoServiceDI, ProductInfoServiceImpl>()(
  '@cloudbeaver/plugin-product-information-administration/ProductInfoService#ProductInfoService',
) {
  static readonly implementation = ProductInfoServiceImpl;
  static readonly PAGE_NAME = ProductInfoServiceImpl.PAGE_NAME;
  static readonly dependencies = () => [AdministrationItemService, ServerLicenseStatusResource] as const;
  static readonly make: Effect.Effect<
    ProductInfoServiceImpl,
    never,
    Context.Service.Identifier<typeof AdministrationItemService> | Context.Service.Identifier<typeof ServerLicenseStatusResource>
  > = Effect.gen(function* makeProductInfoService() {
    const administrationItemService = yield* AdministrationItemService;
    const serverLicenseStatusResource = yield* ServerLicenseStatusResource;

    return new ProductInfoServiceImpl(administrationItemService, serverLicenseStatusResource);
  });
  static readonly layer: Layer.Layer<
    ProductInfoServiceDI,
    never,
    Context.Service.Identifier<typeof AdministrationItemService> | Context.Service.Identifier<typeof ServerLicenseStatusResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ProductInfoService = ProductInfoServiceDI;
