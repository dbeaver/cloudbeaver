/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable } from 'mobx';

import { AppAuthService } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { GraphQLService, CachedMapResource, ResourceKey, ResourceKeyUtils, DatabaseDriverFragment, DriverListQueryVariables, CachedMapAllKey,  resourceKeyList, isResourceKeyAlias, isResourceAlias } from '@cloudbeaver/core-sdk';
import { isArraysEqual } from '@cloudbeaver/core-utils';

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
    this.sync(this.serverConfigResource, () => {}, () => CachedMapAllKey);

    makeObservable(this, {
      enabledDrivers: computed<DBDriver[]>({
        equals: isArraysEqual,
      }),
    });
  }

  compare(driverA: DBDriver, driverB: DBDriver): number {
    if (driverA.promotedScore === driverB.promotedScore) {
      return (driverA.name || '').localeCompare((driverB.name || ''));
    }

    return (driverB.promotedScore || 0) - (driverA.promotedScore || 0);
  }

  protected async loader(
    originalKey: ResourceKey<string>,
    includes?: ReadonlyArray<string>
  ): Promise<Map<string, DBDriver>> {
    const driversList: DBDriver[] = [];
    const all = this.isAlias(originalKey, CachedMapAllKey);

    await ResourceKeyUtils.forEachAsync(originalKey, async key => {
      const driverId = isResourceAlias(key) ? undefined : key;

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

      driversList.push(...drivers);
    });

    const key = resourceKeyList(driversList.map(driver => driver.id));
    if (all) {
      this.replace(key, driversList);
    } else {
      this.set(key, driversList);
    }

    return this.data;
  }

  protected dataSet(key: string, value: DBDriver): void {
    const oldDriver = this.dataGet(key);
    this.data.set(key, { ...oldDriver, ...value });
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}
