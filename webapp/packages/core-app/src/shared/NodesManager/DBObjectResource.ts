/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import {
  GraphQLService, CachedMapResource, ResourceKey, isResourceKeyList, resourceKeyList, ResourceKeyUtils
} from '@cloudbeaver/core-sdk';

import type { DBObject } from './EntityTypes';
import { NavNodeInfoResource } from './NavNodeInfoResource';
import { NavTreeResource } from './NavTreeResource';

@injectable()
export class DBObjectResource extends CachedMapResource<string, DBObject> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly navTreeResource: NavTreeResource
  ) {
    super();

    // this.preloadResource(this.navNodeInfoResource);
    this.navNodeInfoResource.outdateResource(this);
    this.navNodeInfoResource.deleteInResource(this);
    this.navNodeInfoResource.onDataOutdated.addHandler(this.outdateChildren.bind(this));
  }

  async loadChildren(parentId: string, key: ResourceKey<string>): Promise<Map<string, DBObject>> {
    await this.performUpdate(
      key,
      [],
      () => this.loadFromChildren(parentId, 0, this.navTreeResource.childrenLimit + 1),
      () => this.isLoaded(key) && !this.isOutdated(key)
    );

    return this.data;
  }

  protected async loader(key: ResourceKey<string>): Promise<Map<string, DBObject>> {
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

  private outdateChildren(key: ResourceKey<string>): void {
    const childrenToOutdate: string[] = [];

    ResourceKeyUtils.forEach(key, key => {
      childrenToOutdate.push(...this.navTreeResource.get(key) || []);
    });

    const outdateKey = resourceKeyList(childrenToOutdate);

    // if (!this.isOutdated(outdateKey)) {
    this.markOutdated(outdateKey);
    // }
  }
}
