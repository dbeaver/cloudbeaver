/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { CachedMapResource, isResourceAlias, ResourceKeyUtils, type ResourceKey } from '@cloudbeaver/core-resource';
import { SessionDataResource } from '@cloudbeaver/core-root';
import { GraphQLService } from '@cloudbeaver/core-sdk';

import { DBDriverResource, type DriverPropertyInfo } from './DBDriverResource.js';

export class DBDriverExpertSettingsResourceImpl extends CachedMapResource<string, DriverPropertyInfo[]> {
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

export type DBDriverExpertSettingsResource = DBDriverExpertSettingsResourceImpl;

export class DBDriverExpertSettingsResourceDI extends Context.Service<DBDriverExpertSettingsResourceDI, DBDriverExpertSettingsResourceImpl>()(
  '@cloudbeaver/core-connections/DBDriverExpertSettingsResource#DBDriverExpertSettingsResource',
) {
  static readonly implementation = DBDriverExpertSettingsResourceImpl;

  static readonly dependencies = () => [GraphQLService, DBDriverResource, SessionDataResource] as const;
  static readonly make: Effect.Effect<
    DBDriverExpertSettingsResourceImpl,
    never,
    | Context.Service.Identifier<typeof GraphQLService>
    | Context.Service.Identifier<typeof DBDriverResource>
    | Context.Service.Identifier<typeof SessionDataResource>
  > = Effect.gen(function* makeDBDriverExpertSettingsResource() {
    const graphQLService = yield* GraphQLService;
    const dbDriverResource = yield* DBDriverResource;
    const sessionDataResource = yield* SessionDataResource;

    return new DBDriverExpertSettingsResourceImpl(graphQLService, dbDriverResource, sessionDataResource);
  });
  static readonly layer: Layer.Layer<
    DBDriverExpertSettingsResourceDI,
    never,
    | Context.Service.Identifier<typeof GraphQLService>
    | Context.Service.Identifier<typeof DBDriverResource>
    | Context.Service.Identifier<typeof SessionDataResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DBDriverExpertSettingsResource = DBDriverExpertSettingsResourceDI;
