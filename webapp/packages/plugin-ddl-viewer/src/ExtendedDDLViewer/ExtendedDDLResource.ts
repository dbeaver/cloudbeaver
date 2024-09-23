/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { CachedMapResource, isResourceAlias, type ResourceKey, ResourceKeyUtils } from '@cloudbeaver/core-resource';
import { GraphQLService } from '@cloudbeaver/core-sdk';

@injectable()
export class ExtendedDDLResource extends CachedMapResource<string, string> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly navNodeInfoResource: NavNodeInfoResource,
  ) {
    super();

    this.navNodeInfoResource.outdateResource(this);
    this.navNodeInfoResource.deleteInResource(this);
  }

  protected async loader(key: ResourceKey<string>): Promise<Map<string, string>> {
    if (isResourceAlias(key)) {
      throw new Error('Aliases not supported by this resource.');
    }
    const values: string[] = [];

    await ResourceKeyUtils.forEachAsync(key, async nodeId => {
      const { metadataGetNodeExtendedDDL } = await this.graphQLService.sdk.metadataGetNodeExtendedDDL({ nodeId });
      if (metadataGetNodeExtendedDDL) {
        values.push(metadataGetNodeExtendedDDL);
      }
    });

    this.set(ResourceKeyUtils.toList(key), values);

    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}
