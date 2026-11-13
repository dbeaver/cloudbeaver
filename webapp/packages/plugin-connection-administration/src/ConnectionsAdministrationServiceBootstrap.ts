/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ConnectionsAdministrationTabService } from './ConnectionsAdministrationTabService.js';

export class ConnectionsAdministrationServiceBootstrapImpl extends Bootstrap {
  constructor(private readonly connectionsAdministrationTabService: ConnectionsAdministrationTabService) {
    super();
  }

  override register(): void | Promise<void> {
    this.connectionsAdministrationTabService.createRootTab();
  }
}

export type ConnectionsAdministrationServiceBootstrap = ConnectionsAdministrationServiceBootstrapImpl;

export class ConnectionsAdministrationServiceBootstrapDI extends Context.Service<
  ConnectionsAdministrationServiceBootstrapDI,
  ConnectionsAdministrationServiceBootstrapImpl
>()('@cloudbeaver/plugin-connection-administration/ConnectionsAdministrationServiceBootstrap#ConnectionsAdministrationServiceBootstrap') {
  static readonly implementation = ConnectionsAdministrationServiceBootstrapImpl;

  static readonly dependencies = () => [ConnectionsAdministrationTabService] as const;
  static readonly make: Effect.Effect<
    ConnectionsAdministrationServiceBootstrapImpl,
    never,
    Context.Service.Identifier<typeof ConnectionsAdministrationTabService>
  > = Effect.gen(function* makeConnectionsAdministrationServiceBootstrap() {
    const connectionsAdministrationTabService = yield* ConnectionsAdministrationTabService;

    return new ConnectionsAdministrationServiceBootstrapImpl(connectionsAdministrationTabService);
  });
  static readonly layer: Layer.Layer<
    ConnectionsAdministrationServiceBootstrapDI,
    never,
    Context.Service.Identifier<typeof ConnectionsAdministrationTabService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ConnectionsAdministrationServiceBootstrap = ConnectionsAdministrationServiceBootstrapDI;
