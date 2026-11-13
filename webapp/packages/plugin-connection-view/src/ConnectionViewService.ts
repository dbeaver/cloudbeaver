/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionInfoResource, type IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';
import { type NavigatorViewSettings } from '@cloudbeaver/core-root';

import { ConnectionViewResource } from './ConnectionViewResource.js';

export class ConnectionViewServiceImpl {
  constructor(
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly connectionViewResource: ConnectionViewResource,
  ) {}

  async changeConnectionView(connectionKey: IConnectionInfoParams, settings: NavigatorViewSettings): Promise<void> {
    const view = await this.connectionViewResource.changeConnectionView(connectionKey, settings);

    if (settings.userSettings === false && view.navigatorSettings.userSettings) {
      return;
    }

    await this.syncNode(connectionKey);
  }

  async clearConnectionView(connectionKey: IConnectionInfoParams): Promise<void> {
    await this.connectionViewResource.clearConnectionView(connectionKey);
    await this.syncNode(connectionKey);
  }

  private async syncNode(connectionKey: IConnectionInfoParams) {
    const connection = await this.connectionInfoResource.load(connectionKey);

    if (connection.nodePath && connection.connected) {
      await this.navNodeManagerService.refreshNode(connection.nodePath);
    }
  }
}

export type ConnectionViewService = ConnectionViewServiceImpl;

export class ConnectionViewServiceDI extends Context.Service<ConnectionViewServiceDI, ConnectionViewServiceImpl>()(
  '@cloudbeaver/plugin-connection-view/ConnectionViewService#ConnectionViewService',
) {
  static readonly implementation = ConnectionViewServiceImpl;

  static readonly dependencies = () => [ConnectionInfoResource, NavNodeManagerService, ConnectionViewResource] as const;
  static readonly make: Effect.Effect<
    ConnectionViewServiceImpl,
    never,
    | Context.Service.Identifier<typeof ConnectionInfoResource>
    | Context.Service.Identifier<typeof NavNodeManagerService>
    | Context.Service.Identifier<typeof ConnectionViewResource>
  > = Effect.gen(function* makeConnectionViewService() {
    const connectionInfoResource = yield* ConnectionInfoResource;
    const navNodeManagerService = yield* NavNodeManagerService;
    const connectionViewResource = yield* ConnectionViewResource;

    return new ConnectionViewServiceImpl(connectionInfoResource, navNodeManagerService, connectionViewResource);
  });
  static readonly layer: Layer.Layer<
    ConnectionViewServiceDI,
    never,
    | Context.Service.Identifier<typeof ConnectionInfoResource>
    | Context.Service.Identifier<typeof NavNodeManagerService>
    | Context.Service.Identifier<typeof ConnectionViewResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ConnectionViewService = ConnectionViewServiceDI;
