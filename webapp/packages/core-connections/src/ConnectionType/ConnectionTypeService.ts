/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { ThemeService } from '@cloudbeaver/core-theming';

import type { IConnectionInfoParams } from '../CONNECTION_INFO_PARAM_SCHEMA.js';
import { ConnectionInfoResource } from '../ConnectionInfoResource.js';
import { ConnectionTypeResource, mapColorValue, PREDEFINED_UNSET_COLOR } from './ConnectionTypeResource.js';

export class ConnectionTypeServiceImpl {
  constructor(
    private readonly connectionTypeResource: ConnectionTypeResource,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly themeService: ThemeService,
  ) {}

  getConnectionTypeColor(connectionKey: IConnectionInfoParams): string | undefined {
    const connection = this.connectionInfoResource.get(connectionKey);

    if (!connection) {
      return;
    }

    return this.getTypeColor(connection.connectionType);
  }

  getTypeColor(typeId: string): string | undefined {
    const theme = this.themeService.currentTheme?.type;
    const connectionType = this.connectionTypeResource.get(typeId);

    if (!connectionType) {
      return;
    }

    let color = connectionType.colorLight;

    if (connectionType.colorDark && theme === 'dark') {
      color = connectionType.colorDark;
    }

    if (color === PREDEFINED_UNSET_COLOR) {
      return;
    }

    return mapColorValue(color);
  }
}

export type ConnectionTypeService = ConnectionTypeServiceImpl;

export class ConnectionTypeServiceDI extends Context.Service<ConnectionTypeServiceDI, ConnectionTypeServiceImpl>()(
  '@cloudbeaver/core-connections/ConnectionType/ConnectionTypeService#ConnectionTypeService',
) {
  static readonly implementation = ConnectionTypeServiceImpl;

  static readonly dependencies = () => [ConnectionTypeResource, ConnectionInfoResource, ThemeService] as const;
  static readonly make: Effect.Effect<
    ConnectionTypeServiceImpl,
    never,
    | Context.Service.Identifier<typeof ConnectionTypeResource>
    | Context.Service.Identifier<typeof ConnectionInfoResource>
    | Context.Service.Identifier<typeof ThemeService>
  > = Effect.gen(function* makeConnectionTypeService() {
    const connectionTypeResource = yield* ConnectionTypeResource;
    const connectionInfoResource = yield* ConnectionInfoResource;
    const themeService = yield* ThemeService;

    return new ConnectionTypeServiceImpl(connectionTypeResource, connectionInfoResource, themeService);
  });
  static readonly layer: Layer.Layer<
    ConnectionTypeServiceDI,
    never,
    | Context.Service.Identifier<typeof ConnectionTypeResource>
    | Context.Service.Identifier<typeof ConnectionInfoResource>
    | Context.Service.Identifier<typeof ThemeService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ConnectionTypeService = ConnectionTypeServiceDI;
