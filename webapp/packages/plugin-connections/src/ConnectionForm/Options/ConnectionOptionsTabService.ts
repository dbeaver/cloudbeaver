/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { ConnectionFormService } from '../ConnectionFormService.js';

export const Options = React.lazy(async () => {
  const { OptionsPanel } = await import('./OptionsPanel.js');
  return { default: OptionsPanel };
});

export class ConnectionOptionsTabServiceImpl extends Bootstrap {
  constructor(private readonly connectionFormService: ConnectionFormService) {
    super();
  }

  override register(): void {
    this.connectionFormService.parts.add({
      key: 'options',
      name: 'plugin_connections_connection_form_part_main',
      title: 'plugin_connections_connection_form_part_main',
      icon: '/icons/core_blocks_plug.svg',
      order: 1,
      panel: () => Options,
    });
  }
}

export type ConnectionOptionsTabService = ConnectionOptionsTabServiceImpl;

export class ConnectionOptionsTabServiceDI extends Context.Service<ConnectionOptionsTabServiceDI, ConnectionOptionsTabServiceImpl>()(
  '@cloudbeaver/plugin-connections/ConnectionForm/Options/ConnectionOptionsTabService#ConnectionOptionsTabService',
) {
  static readonly implementation = ConnectionOptionsTabServiceImpl;

  static readonly dependencies = () => [ConnectionFormService] as const;
  static readonly make: Effect.Effect<ConnectionOptionsTabServiceImpl, never, Context.Service.Identifier<typeof ConnectionFormService>> = Effect.gen(
    function* makeConnectionOptionsTabService() {
      const connectionFormService = yield* ConnectionFormService;

      return new ConnectionOptionsTabServiceImpl(connectionFormService);
    },
  );
  static readonly layer: Layer.Layer<ConnectionOptionsTabServiceDI, never, Context.Service.Identifier<typeof ConnectionFormService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ConnectionOptionsTabService = ConnectionOptionsTabServiceDI;
