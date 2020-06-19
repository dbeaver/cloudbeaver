/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { GraphQLService, CachedResource } from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { DBObject } from './EntityTypes';

export interface IDBObjectParams {
  navNodeId: string[];
  remove?: boolean;
  parentId?: never;
}

export interface IDBObjectValueParams {
  parentId: string;
  navNodeId: string[];
  remove?: never;
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
  async load(navNodeId: string[], parentId?: string): Promise<DBObject[]>
  async load(navNodeId: string | string[], parentId?: string): Promise<DBObject | DBObject[]> {
    const dbObject = await this.dbObject.load({
      navNodeId: Array.isArray(navNodeId) ? navNodeId : [navNodeId],
      parentId,
    });

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
    data: IDBObjectParams | IDBObjectValueParams
  ) {

    if (data.parentId) {
      for (const navNodeId of data.navNodeId) {
        const itemMetadata = metadata.get(navNodeId);
        itemMetadata.loaded = false;
        if (load) {
          itemMetadata.loading = true;
        }
      }

      if (load) {
        try {
          const { dbObjects } = await this.graphQLService.gql.getChildrenDBObjectInfo({
            navNodeId: data.parentId,
          });

          for (const navNodeId of data.navNodeId) {
            const data = dbObjects.find(dbObject => dbObject.id === navNodeId);

            if (data) {
              const itemMetadata = metadata.get(navNodeId);
              dbObject.set(navNodeId, { navNodeId, ...data.object } as DBObject);
              itemMetadata.loaded = true;
            }
          }
        } finally {
          for (const navNodeId of data.navNodeId) {
            const itemMetadata = metadata.get(navNodeId);
            itemMetadata.loading = false;
          }
        }
      }

      return dbObject;
    }

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
