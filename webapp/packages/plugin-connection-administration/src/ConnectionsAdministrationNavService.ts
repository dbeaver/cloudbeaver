/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { ADMINISTRATION_CONNECTIONS_ITEM } from './ADMINISTRATION_CONNECTIONS_ITEM.js';

export class ConnectionsAdministrationNavServiceImpl {
  constructor(private readonly administrationScreenService: AdministrationScreenService) {}

  navToRoot(): void {
    this.administrationScreenService.navigateToItem(ADMINISTRATION_CONNECTIONS_ITEM);
  }

  navToSub(sub: string, param?: string): void {
    this.administrationScreenService.navigateToItemSub(ADMINISTRATION_CONNECTIONS_ITEM, sub, param);
  }
}

export type ConnectionsAdministrationNavService = ConnectionsAdministrationNavServiceImpl;

export class ConnectionsAdministrationNavServiceDI extends Context.Service<
  ConnectionsAdministrationNavServiceDI,
  ConnectionsAdministrationNavServiceImpl
>()('@cloudbeaver/plugin-connection-administration/ConnectionsAdministrationNavService#ConnectionsAdministrationNavService') {
  static readonly implementation = ConnectionsAdministrationNavServiceImpl;

  static readonly dependencies = () => [AdministrationScreenService] as const;
  static readonly make: Effect.Effect<
    ConnectionsAdministrationNavServiceImpl,
    never,
    Context.Service.Identifier<typeof AdministrationScreenService>
  > = Effect.gen(function* makeConnectionsAdministrationNavService() {
    const administrationScreenService = yield* AdministrationScreenService;

    return new ConnectionsAdministrationNavServiceImpl(administrationScreenService);
  });
  static readonly layer: Layer.Layer<ConnectionsAdministrationNavServiceDI, never, Context.Service.Identifier<typeof AdministrationScreenService>> =
    Layer.effect(
      this,
      Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
    );
}

export const ConnectionsAdministrationNavService = ConnectionsAdministrationNavServiceDI;
