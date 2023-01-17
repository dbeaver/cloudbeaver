/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { GraphQLService, CachedMapResource, ResourceKey, isResourceKeyList } from '@cloudbeaver/core-sdk';

@injectable()
export class ExtendedDDLResource extends CachedMapResource<string, string> {
  constructor(
    private readonly graphQLService: GraphQLService,
  ) {
    super();
  }

  protected async loader(key: ResourceKey<string>): Promise<Map<string, string>> {
    if (isResourceKeyList(key)) {
      const values: string[] = [];
      for (const nodeId of key.list) {
        const metadata = await this.loadMetadata(nodeId);
        if (metadata) {
          values.push(metadata);
        }
      }
      this.set(key, values);
    } else {
      const metadata = await this.loadMetadata(key);
      if (metadata) {
        this.set(key, metadata);
      }
    }

    return this.data;
  }

  private async loadMetadata(nodeId: string) {
    const { metadataGetNodeExtendedDDL } = await this.graphQLService.sdk.metadataGetNodeExtendedDDL({ nodeId });
    return metadataGetNodeExtendedDDL;
  }
}
