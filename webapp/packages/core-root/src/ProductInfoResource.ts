/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { GraphQLService, type ProductInfoFragment } from '@cloudbeaver/core-sdk';

import { SessionDataResource } from './SessionDataResource.js';

export type ProductInfo = ProductInfoFragment['productInfo'];

@injectable()
export class ProductInfoResource extends CachedDataResource<ProductInfo | null> {
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
