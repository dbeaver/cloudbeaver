/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable, runInAction } from 'mobx';

import { AppAuthService } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import {
  GraphQLService,
  CachedMapResource,
  ResourceKey,
  ResourceKeyUtils,
  DatabaseDriverFragment,
  DriverListQueryVariables,
  CachedMapAllKey,
  resourceKeyList
} from '@cloudbeaver/core-sdk';

export type DBDriver = DatabaseDriverFragment;

@injectable()
export class DBDriverResource extends CachedMapResource<string, DBDriver, DriverListQueryVariables> {
  get enabledDrivers() {
    return this.values
      .filter(driver => driver.enabled)
      .sort(this.compare);
  }

  constructor(
    private readonly serverConfigResource: ServerConfigResource,
    private readonly graphQLService: GraphQLService,
    appAuthService: AppAuthService,
  ) {
    super();
    appAuthService.requireAuthentication(this);

    this.serverConfigResource.onDataOutdated.addHandler(() => this.markOutdated());

    makeObservable(this, {
      enabledDrivers: computed,
    });
  }

  async loadAll(): Promise<Map<string, DBDriver>> {
    await this.load(CachedMapAllKey);
    return this.data;
  }

  compare(driverA: DBDriver, driverB: DBDriver): number {
    if (driverA.promotedScore === driverB.promotedScore) {
      return (driverA.name || '').localeCompare((driverB.name || ''));
    }

    return (driverB.promotedScore || 0) - (driverA.promotedScore || 0);
  }

  protected async loader(key: ResourceKey<string>, includes?: ReadonlyArray<string>): Promise<Map<string, DBDriver>> {
    const all = ResourceKeyUtils.includes(key, CachedMapAllKey);
    key = this.transformParam(key);

    await ResourceKeyUtils.forEachAsync(all ? CachedMapAllKey : key, async key => {
      const driverId = all ? undefined : key;

      const { drivers } = await this.graphQLService.sdk.driverList({
        driverId,
        includeDriverParameters: false,
        includeDriverProperties: false,
        includeProviderProperties: false,
        ...this.getIncludesMap(driverId, (all ? this.defaultIncludes : includes)),
      });

      if (driverId && !drivers.some(driver => driver.id === driverId)) {
        throw new Error('Driver is not found');
      }

      runInAction(() => {
        if (all) {
          const removedDrivers = this.keys.filter(key => !drivers.some(driver => driver.id === key));
          this.delete(resourceKeyList(removedDrivers));
        }

        this.updateDriver(...drivers);
      });
    });

    return this.data;
  }

  private updateDriver(...drivers: DBDriver[]) {
    const keys = resourceKeyList(drivers.map(driver => driver.id));

    const oldDriver = this.get(keys);
    this.set(keys, oldDriver.map((oldDriver, i) => (Object.assign(oldDriver ?? {}, drivers[i]))));
  }

  protected validateParam(param: ResourceKey<string>): boolean {
    return (
      super.validateParam(param)
      || typeof param === 'string'
    );
  }
}
