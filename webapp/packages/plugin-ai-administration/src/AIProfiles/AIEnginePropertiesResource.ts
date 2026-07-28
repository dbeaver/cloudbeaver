/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { runInAction } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { CachedMapResource, type ResourceKeySimple, ResourceKeyUtils } from '@cloudbeaver/core-resource';
import { EAdminPermission, SessionPermissionsResource } from '@cloudbeaver/core-root';
import { GraphQLService, type AiEngineConfig, type IObjectPropertyInfo } from '@cloudbeaver/core-sdk';

export const MODEL_PROPERTY_ID = 'model';

@injectable(() => [GraphQLService, SessionPermissionsResource])
export class AIEnginePropertiesResource extends CachedMapResource<string, IObjectPropertyInfo[]> {
  constructor(
    private readonly graphQLService: GraphQLService,
    permissionsResource: SessionPermissionsResource,
  ) {
    super(() => new Map(), []);

    permissionsResource.require(this, EAdminPermission.admin).outdateResource(this);
  }

  async loadProperties(engineId: string, profileId?: string, settings?: AiEngineConfig): Promise<IObjectPropertyInfo[]> {
    const { properties } = await this.graphQLService.sdk.getEngineProperties({ engineId, profileId, settings });
    return properties;
  }

  protected async loader(originalKey: ResourceKeySimple<string>): Promise<Map<string, IObjectPropertyInfo[]>> {
    await ResourceKeyUtils.forEachAsync(originalKey, async engineId => {
      const { properties } = await this.graphQLService.sdk.getEngineProperties({ engineId });

      runInAction(() => {
        this.set(engineId, properties);
      });
    });

    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}
