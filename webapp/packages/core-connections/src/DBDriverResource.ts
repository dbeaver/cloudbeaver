/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { AppAuthService } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { CachedMapAllKey, CachedMapResource, isResourceAlias, type ResourceKey, resourceKeyList, ResourceKeyUtils } from '@cloudbeaver/core-resource';
import { ServerConfigResource, WorkspaceConfigEventHandler } from '@cloudbeaver/core-root';
import {
  CbServerEventId,
  type DatabaseDriverFragment,
  DriverConfigurationType,
  type DriverListQueryVariables,
  GraphQLService,
} from '@cloudbeaver/core-sdk';
import { isArraysEqual } from '@cloudbeaver/core-utils';

export type DBDriver = DatabaseDriverFragment;

export const NEW_DRIVER_SYMBOL = Symbol('new-driver');

export type NewDBDriver = DBDriver & { [NEW_DRIVER_SYMBOL]: boolean; timestamp: number };
export type DBDriverResourceIncludes = Omit<DriverListQueryVariables, 'driverId'>;

@injectable()
export class DBDriverResource extends CachedMapResource<string, DBDriver, DBDriverResourceIncludes> {
  get enabledDrivers() {
    return this.values.filter(driver => driver.enabled).sort(this.compare);
  }

  constructor(
    private readonly serverConfigResource: ServerConfigResource,
    private readonly graphQLService: GraphQLService,
    private readonly workspaceConfigEventHandler: WorkspaceConfigEventHandler,
    appAuthService: AppAuthService,
  ) {
    super();
    appAuthService.requireAuthentication(this);
    this.sync(
      this.serverConfigResource,
      () => {},
      () => CachedMapAllKey,
    );

    this.workspaceConfigEventHandler.onEvent(
      CbServerEventId.CbWorkspaceConfigChanged,
      () => {
        this.markOutdated(CachedMapAllKey);
      },
      undefined,
      this,
    );

    makeObservable(this, {
      enabledDrivers: computed<DBDriver[]>({
        equals: isArraysEqual,
      }),
    });
  }

  compare(driverA: DBDriver, driverB: DBDriver): number {
    if (driverA.promotedScore === driverB.promotedScore) {
      return (driverA.name || '').localeCompare(driverB.name || '');
    }

    return (driverB.promotedScore || 0) - (driverA.promotedScore || 0);
  }

  protected async loader(originalKey: ResourceKey<string>, includes?: ReadonlyArray<string>): Promise<Map<string, DBDriver>> {
    const driversList: DBDriver[] = [];
    const all = this.aliases.isAlias(originalKey, CachedMapAllKey);

    await ResourceKeyUtils.forEachAsync(originalKey, async key => {
      const driverId = isResourceAlias(key) ? undefined : key;

      const { drivers } = await this.graphQLService.sdk.driverList({
        driverId,
        ...this.getDefaultIncludes(),
        ...this.getIncludesMap(driverId, all ? this.defaultIncludes : includes),
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

  async addDriverLibraries(driverId: string, files: File[]) {
    await this.graphQLService.sdk.uploadDriverLibrary(driverId, files);
    await this.markOutdated(driverId);
  }

  protected override dataSet(key: string, value: DBDriver): void {
    const oldDriver = this.dataGet(key);
    this.data.set(key, { ...oldDriver, ...value });
  }

  async refreshAll(): Promise<Map<string, DBDriver>> {
    this.resetIncludes();
    await this.refresh(CachedMapAllKey);
    return this.data;
  }

  cleanNewFlags(): void {
    for (const driver of this.data.values()) {
      (driver as NewDBDriver)[NEW_DRIVER_SYMBOL] = false;
    }
  }

  getDefaultIncludes(): DBDriverResourceIncludes {
    return {
      includeDriverParameters: false,
      includeDriverProperties: false,
      includeMainProperties: false,
      includeProviderProperties: false,
    };
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}

function isNewDriver(driver: DBDriver | NewDBDriver): driver is NewDBDriver {
  return (driver as NewDBDriver)[NEW_DRIVER_SYMBOL];
}

export function compareNewDrivers(a: DBDriver, b: DBDriver): number {
  if (isNewDriver(a) && isNewDriver(b)) {
    return b.timestamp - a.timestamp;
  }

  if (isNewDriver(b)) {
    return 1;
  }

  if (isNewDriver(a)) {
    return -1;
  }

  return 0;
}

export function getDBDriverDefaultAuthModelId(driver: DBDriver | undefined): string | undefined {
  return driver?.defaultAuthModel || driver?.applicableAuthModels[0];
}

export function getDBDriverDefaultConfigurationType(driver: DBDriver | undefined): DriverConfigurationType {
  return driver?.configurationTypes[0] || DriverConfigurationType.Manual;
}

export function getDBDriverDefaultServerName(driver: DBDriver | undefined): string | undefined {
  return driver?.requiresServerName ? '' : undefined;
}

export function getDBDriverDefaultServer(driver: DBDriver | undefined): string | undefined {
  return driver?.defaultServer || 'localhost';
}
