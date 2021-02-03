/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import {
  NetworkHandlerDescriptor,
  GraphQLService,
  CachedMapResource,
  resourceKeyList
} from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

@injectable()
export class NetworkHandlerResource extends CachedMapResource<string, NetworkHandlerDescriptor> {
  private loadedKeyMetadata: MetadataMap<string, boolean>;

  constructor(private graphQLService: GraphQLService) {
    super(new Map());
    this.loadedKeyMetadata = new MetadataMap(() => false);
  }

  has(id: string): boolean {
    if (this.loadedKeyMetadata.has(id)) {
      return this.loadedKeyMetadata.get(id);
    }

    return this.data.has(id);
  }

  async loadAll(): Promise<Map<string, NetworkHandlerDescriptor>> {
    await this.load('all');
    return this.data;
  }

  protected async loader(key: string): Promise<Map<string, NetworkHandlerDescriptor>> {
    const { handlers } = await this.graphQLService.sdk.getNetworkHandlers();

    this.set(resourceKeyList(handlers.map(handler => handler.id)), handlers as NetworkHandlerDescriptor[]);

    // TODO: networkHandlers must accept descriptorId, so we can update some descriptor or all descriptors,
    //       here we should check is it's was a full update
    this.loadedKeyMetadata.set('all', true);

    return this.data;
  }
}
