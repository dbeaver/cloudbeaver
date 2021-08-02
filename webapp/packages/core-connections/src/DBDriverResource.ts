/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import {
  GraphQLService,
  CachedMapResource,
  ResourceKey,
  ResourceKeyUtils,
  DatabaseDriverFragment,
  DriverListQueryVariables
} from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

export type DBDriver = DatabaseDriverFragment;

const allKey = 'all';

@injectable()
export class DBDriverResource extends CachedMapResource<string, DBDriver, DriverListQueryVariables> {
  private loadedKeyMetadata: MetadataMap<string, boolean>;

  constructor(private graphQLService: GraphQLService) {
    super();
    this.loadedKeyMetadata = new MetadataMap(() => false);
  }

  has(id: string): boolean {
    if (this.loadedKeyMetadata.has(id)) {
      return this.loadedKeyMetadata.get(id);
    }

    return this.data.has(id);
  }

  async loadAll(): Promise<Map<string, DBDriver>> {
    await this.load(allKey);
    return this.data;
  }

  compare(driverA: DBDriver, driverB: DBDriver): number {
    if (driverA.promotedScore === driverB.promotedScore) {
      return (driverA.name || '').localeCompare((driverB.name || ''));
    }

    return (driverB.promotedScore || 0) - (driverA.promotedScore || 0);
  }

  protected async loader(key: ResourceKey<string>, includes: string[]): Promise<Map<string, DBDriver>> {
    await ResourceKeyUtils.forEachAsync(key, async key => {
      const { drivers } = await this.graphQLService.sdk.driverList({
        driverId: key === allKey ? undefined : key,
        includeDriverParameters: false,
        includeDriverProperties: false,
        includeProviderProperties: false,
        ...this.getIncludesMap(key === allKey ? undefined : key, includes),
      });

      if (key === allKey) {
        this.resetIncludes();
        this.data.clear();
      }

      for (const driver of drivers) {
        this.updateDriver(driver);
      }

      if (key === allKey) {
        // TODO: driverList must accept driverId, so we can update some drivers or all drivers,
        //       here we should check is it's was a full update
        this.loadedKeyMetadata.set(allKey, true);
      }
    });

    return this.data;
  }

  private updateDriver(driver: DBDriver) {
    const oldDriver = this.get(driver.id) || {};
    this.set(driver.id, { ...oldDriver, ...driver });
  }
}
