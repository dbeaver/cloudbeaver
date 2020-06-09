/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@dbeaver/core/di';
import { GraphQLService, CachedResource } from '@dbeaver/core/sdk';
import { MetadataMap } from '@dbeaver/core/utils';

import { DBObject } from './EntityTypes';

export interface IDBObjectParams {
  navNodeId: string[];
  remove?: boolean;
}

interface IDBObjectMetadata {
  loaded: boolean;
  loading: boolean;
}

@injectable()
export class DBObjectService {
  readonly dbObject = new CachedResource(
    new Map(),
    this.loadDBObject.bind(this),
    (_, metadata, { navNodeId }) => navNodeId.every(navNodeId => metadata.get(navNodeId).loaded),
    new MetadataMap<string, IDBObjectMetadata>(() => ({ loaded: false, loading: false })),
    (_, metadata, { navNodeId }) => navNodeId.some(navNodeId => metadata.get(navNodeId).loading)
  )

  constructor(private graphQLService: GraphQLService) { }

  getDBObject(navNodeId: string) {
    return this.dbObject.data.get(navNodeId);
  }

  async load(navNodeId: string): Promise< DBObject>
  async load(navNodeId: string[]): Promise<DBObject[]>
  async load(navNodeId: string | string[]): Promise<DBObject | DBObject[]> {
    const dbObject = await this.dbObject.load({ navNodeId: Array.isArray(navNodeId) ? navNodeId : [navNodeId] });

    if (!Array.isArray(navNodeId)) {
      return dbObject.get(navNodeId)!;
    }
    return navNodeId.map(navNodeId => dbObject.get(navNodeId)!);
  }

  async remove(navNodeId: string[]) {
    await this.dbObject.refresh(true, { navNodeId, remove: true });
  }

  private async loadDBObject(
    dbObject: Map<string, DBObject>,
    metadata: MetadataMap<string, IDBObjectMetadata>,
    load: boolean,
    data: IDBObjectParams
  ) {
    for (const navNodeId of data.navNodeId) {
      if (data.remove) {
        dbObject.delete(navNodeId);
        metadata.delete(navNodeId);
      } else {
        const itemMetadata = metadata.get(navNodeId);

        itemMetadata.loaded = false;
        if (load) {
          itemMetadata.loading = true;

          try {
            const { objectInfo: { object } } = await this.graphQLService.gql.getDBObjectInfo({
              navNodeId,
            });

            dbObject.set(navNodeId, { navNodeId, ...object } as DBObject);
            itemMetadata.loaded = true;
          } finally {
            itemMetadata.loading = false;
          }
        }
      }
    }
    return dbObject;
  }
}
