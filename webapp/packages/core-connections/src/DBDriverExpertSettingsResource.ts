/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { CachedMapResource, isResourceAlias, ResourceKeyUtils, type ResourceKey } from '@cloudbeaver/core-resource';
import { GraphQLService } from '@cloudbeaver/core-sdk';
import { injectable } from '@cloudbeaver/core-di';
import { SessionDataResource } from '@cloudbeaver/core-root';

import { DBDriverResource, type DriverPropertyInfo } from './DBDriverResource.js';

@injectable(() => [GraphQLService, DBDriverResource, SessionDataResource])
export class DBDriverExpertSettingsResource extends CachedMapResource<string, DriverPropertyInfo[]> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly dbDriverResource: DBDriverResource,
    private readonly sessionDataResource: SessionDataResource,
  ) {
    super();

    this.sessionDataResource.outdateResource(this);
    this.sync(this.dbDriverResource);
    this.dbDriverResource.onItemDelete.addHandler(this.delete.bind(this));
  }

  protected async loader(originalKey: ResourceKey<string>): Promise<Map<string, DriverPropertyInfo[]>> {
    if (isResourceAlias(originalKey)) {
      throw new Error('Aliases not supported by this resource.');
    }

    const values: DriverPropertyInfo[][] = [];

    await ResourceKeyUtils.forEachAsync(originalKey, async key => {
      const { drivers } = await this.graphQLService.sdk.getDriverExpertProperties({ driverId: key });

      if (drivers.length === 0) {
        throw new Error('Driver not found');
      }

      const driver = drivers[0]!;

      values.push(driver.expertSettingsProperties);
    });

    this.set(ResourceKeyUtils.toList(originalKey), values);

    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}
