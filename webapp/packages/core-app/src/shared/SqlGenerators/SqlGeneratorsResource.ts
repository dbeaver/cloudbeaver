/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import {
  GraphQLService,
  CachedMapResource,
  ResourceKey,
  SqlQueryGenerator,
  ResourceKeyUtils,
  resourceKeyList,
} from '@cloudbeaver/core-sdk';

import { NavNodeInfoResource } from '../NodesManager/NavNodeInfoResource';

export const MAX_GENERATORS_LENGTH = 15;

@injectable()
export class SqlGeneratorsResource extends CachedMapResource<string, SqlQueryGenerator[]> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly navNodeInfoResource: NavNodeInfoResource
  ) {
    super();

    this.navNodeInfoResource.outdateResource(this);
    this.navNodeInfoResource.deleteInResource(this);
  }

  async generateEntityQuery(
    generatorId: string,
    nodePathList: string | string[],
  ): Promise<string> {
    const result = await this.graphQLService.sdk.sqlGenerateEntityQuery({
      generatorId,
      nodePathList,
      options: {},
    });

    return result.sqlGenerateEntityQuery;
  }

  protected async loader(key: ResourceKey<string>): Promise<Map<string, SqlQueryGenerator[]>> {
    const values = new Map();

    await ResourceKeyUtils.forEachAsync(key, async key => {
      const { generators } = await this.graphQLService.sdk.sqlEntityQueryGenerators(({
        nodePathList: key,
      }));
      values.set(key, generators);
    });

    this.set(resourceKeyList(Array.from(values.keys())), Array.from(values.values()));
    return this.data;
  }
}
