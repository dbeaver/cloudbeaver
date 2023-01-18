/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { GraphQLService, CachedMapResource, ResourceKey, ResourceKeyUtils, isResourceKeyList } from '@cloudbeaver/core-sdk';

@injectable()
export class ExtendedDDLResource extends CachedMapResource<string, string> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly navNodeInfoResource: NavNodeInfoResource
  ) {
    super();

    this.navNodeInfoResource.outdateResource(this);
    this.navNodeInfoResource.deleteInResource(this);
  }

  protected async loader(key: ResourceKey<string>): Promise<Map<string, string>> {
    const values: string[] = [];

    await ResourceKeyUtils.forEachAsync(key, async nodeId => {
      const { metadataGetNodeExtendedDDL } = await this.graphQLService.sdk.metadataGetNodeExtendedDDL({ nodeId });
      if (metadataGetNodeExtendedDDL) {
        values.push(metadataGetNodeExtendedDDL);
      }
    });

    this.set(key, isResourceKeyList(key) ? values : values[0]);

    return this.data;
  }
}
