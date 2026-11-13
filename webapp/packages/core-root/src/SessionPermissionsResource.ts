/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { CachedDataResource, CachedResource } from '@cloudbeaver/core-resource';
import { GraphQLService } from '@cloudbeaver/core-sdk';

import { DataSynchronizationService } from './DataSynchronization/DataSynchronizationService.js';
import { SessionDataResource } from './SessionDataResource.js';
import { ServerEventId } from './SessionEventSource.js';
import { type ISessionPermissionEvent, SessionPermissionEventHandler } from './SessionPermissionEventHandler.js';
import { SessionResource } from './SessionResource.js';

export class SessionPermissionsResourceImpl extends CachedDataResource<Set<string>> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly dataSynchronizationService: DataSynchronizationService,
    sessionDataResource: SessionDataResource,
    sessionResource: SessionResource,
    sessionPermissionEventHandler: SessionPermissionEventHandler,
  ) {
    super(() => new Set());

    this.sync(
      sessionDataResource,
      () => {},
      () => {},
    );

    sessionPermissionEventHandler.onEvent<ISessionPermissionEvent>(
      ServerEventId.CbSubjectPermissionsUpdated,
      () => {
        this.dataSynchronizationService.requestSynchronization('permissions', 'app_root_event_permissions_changed_message').then(state => {
          if (state) {
            sessionResource.markOutdated();
          }
        });
      },
      undefined,
      sessionResource,
    );
  }

  require(resource: CachedResource<any, any, any, any, any>, ...permissions: string[]): this {
    resource.preloadResource(this, () => undefined).before(ExecutorInterrupter.interrupter(() => !this.has(...permissions)));

    return this;
  }

  has(...permissions: string[]): boolean {
    return !permissions.some(permission => !this.data.has(permission));
  }

  async hasAsync(id: string): Promise<boolean> {
    await this.load();
    return this.has(id);
  }

  protected async loader(): Promise<Set<string>> {
    const { permissions } = await this.graphQLService.sdk.sessionPermissions();

    this.data.clear();

    for (const permission of permissions) {
      this.data.add(permission);
    }

    return this.data;
  }
}

export type SessionPermissionsResource = SessionPermissionsResourceImpl;

export class SessionPermissionsResourceDI extends Context.Service<SessionPermissionsResourceDI, SessionPermissionsResourceImpl>()(
  '@cloudbeaver/core-root/SessionPermissionsResource#SessionPermissionsResource',
) {
  static readonly implementation = SessionPermissionsResourceImpl;

  static readonly dependencies = () =>
    [GraphQLService, DataSynchronizationService, SessionDataResource, SessionResource, SessionPermissionEventHandler] as const;
  static readonly make: Effect.Effect<
    SessionPermissionsResourceImpl,
    never,
    | Context.Service.Identifier<typeof GraphQLService>
    | Context.Service.Identifier<typeof DataSynchronizationService>
    | Context.Service.Identifier<typeof SessionDataResource>
    | Context.Service.Identifier<typeof SessionResource>
    | Context.Service.Identifier<typeof SessionPermissionEventHandler>
  > = Effect.gen(function* makeSessionPermissionsResource() {
    const graphQLService = yield* GraphQLService;
    const dataSynchronizationService = yield* DataSynchronizationService;
    const sessionDataResource = yield* SessionDataResource;
    const sessionResource = yield* SessionResource;
    const sessionPermissionEventHandler = yield* SessionPermissionEventHandler;

    return new SessionPermissionsResourceImpl(
      graphQLService,
      dataSynchronizationService,
      sessionDataResource,
      sessionResource,
      sessionPermissionEventHandler,
    );
  });
  static readonly layer: Layer.Layer<
    SessionPermissionsResourceDI,
    never,
    | Context.Service.Identifier<typeof GraphQLService>
    | Context.Service.Identifier<typeof DataSynchronizationService>
    | Context.Service.Identifier<typeof SessionDataResource>
    | Context.Service.Identifier<typeof SessionResource>
    | Context.Service.Identifier<typeof SessionPermissionEventHandler>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SessionPermissionsResource = SessionPermissionsResourceDI;
