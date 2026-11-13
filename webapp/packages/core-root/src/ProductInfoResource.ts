/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { GraphQLService, type ProductInfoFragment } from '@cloudbeaver/core-sdk';

import { SessionDataResource } from './SessionDataResource.js';

export type ProductInfo = ProductInfoFragment['productInfo'];

export class ProductInfoResourceImpl extends CachedDataResource<ProductInfo | null> {
  constructor(
    private readonly graphQLService: GraphQLService,
    sessionDataResource: SessionDataResource,
  ) {
    super(() => null, undefined, []);
    this.sync(sessionDataResource);
  }

  protected async loader(): Promise<ProductInfo> {
    const { productInfo } = await this.graphQLService.sdk.getProductInfo();

    return productInfo.productInfo;
  }
}

export type ProductInfoResource = ProductInfoResourceImpl;

export class ProductInfoResourceDI extends Context.Service<ProductInfoResourceDI, ProductInfoResourceImpl>()(
  '@cloudbeaver/core-root/ProductInfoResource#ProductInfoResource',
) {
  static readonly implementation = ProductInfoResourceImpl;

  static readonly dependencies = () => [GraphQLService, SessionDataResource] as const;
  static readonly make: Effect.Effect<
    ProductInfoResourceImpl,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof SessionDataResource>
  > = Effect.gen(function* makeProductInfoResource() {
    const graphQLService = yield* GraphQLService;
    const sessionDataResource = yield* SessionDataResource;

    return new ProductInfoResourceImpl(graphQLService, sessionDataResource);
  });
  static readonly layer: Layer.Layer<
    ProductInfoResourceDI,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof SessionDataResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ProductInfoResource = ProductInfoResourceDI;
