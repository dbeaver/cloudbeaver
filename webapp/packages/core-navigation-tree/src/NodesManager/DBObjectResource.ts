/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import {
  GraphQLService, CachedMapResource, ResourceKey, isResourceKeyList, resourceKeyList, ResourceKeyUtils, ResourceKeyList
} from '@cloudbeaver/core-sdk';

import type { DBObject } from './EntityTypes';
import { NavNodeInfoResource } from './NavNodeInfoResource';
import { NavTreeResource } from './NavTreeResource';

const dbObjectParentKeySymbol = Symbol('@db-object/parent') as unknown as string;
export const DBObjectParentKey = (parentId: string) => resourceKeyList<string>(
  [dbObjectParentKeySymbol],
  parentId
);

@injectable()
export class DBObjectResource extends CachedMapResource<string, DBObject> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly navTreeResource: NavTreeResource
  ) {
    super();

    this.addAlias(
      isDBObjectParentKey,
      param => resourceKeyList(navTreeResource.get(param.mark) || []),
      (a, b) => a.mark === b.mark
    );
    // this.preloadResource(this.navNodeInfoResource);
    this.navNodeInfoResource.outdateResource(this);
    this.navNodeInfoResource.deleteInResource(this);
  }

  protected async loader(originalKey: ResourceKey<string>): Promise<Map<string, DBObject>> {
    const key = this.transformParam(originalKey);

    if (isDBObjectParentKey(originalKey)) {
      await this.loadFromChildren(originalKey.mark, 0, this.navTreeResource.childrenLimit + 1);
      return this.data;
    }

    if (isResourceKeyList(key)) {
      const values: DBObject[] = [];
      for (const navNodeId of key.list) {
        values.push(await this.loadDBObjectInfo(navNodeId));
      }
      this.set(key, values);
    } else {
      this.set(key, await this.loadDBObjectInfo(key));
    }

    return this.data;
  }

  private async loadFromChildren(parentId: string, offset: number, limit: number) {
    const { dbObjects } = await this.graphQLService.sdk.getChildrenDBObjectInfo({
      navNodeId: parentId,
      offset,
      limit,
    });

    this.set(resourceKeyList(dbObjects.map(dbObject => dbObject.id)), dbObjects);
  }

  private async loadDBObjectInfo(navNodeId: string): Promise<DBObject> {
    const { objectInfo } = await this.graphQLService.sdk.getDBObjectInfo({
      navNodeId,
    });

    return objectInfo;
  }

  private outdateChildren(key: ResourceKey<string> | undefined): void {
    if (!key) {
      this.markOutdated();
      return;
    }

    const childrenToOutdate: string[] = [];

    ResourceKeyUtils.forEach(key, key => {
      childrenToOutdate.push(...this.navTreeResource.get(key) || []);
    });

    const outdateKey = resourceKeyList(childrenToOutdate);

    // if (!this.isOutdated(outdateKey)) {
    this.markOutdated(outdateKey);
    // }
  }

  protected validateParam(param: ResourceKey<string>): boolean {
    return (
      super.validateParam(param)
      || typeof param === 'string'
    );
  }
}

function isDBObjectParentKey(
  param: ResourceKey<string>
): param is ResourceKeyList<string> {
  return isResourceKeyList(param) && param.list.includes(dbObjectParentKeySymbol);
}
