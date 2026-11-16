/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { ConnectionFormAiService } from '../../connection-ai-settings/ConnectionFormAiService.js';

const ConnectionAiScope = importLazyComponent(() => import('./ConnectionAiScope.js').then(m => m.ConnectionAiScope));

export class ConnectionAiScopeServiceImpl {
  constructor(private readonly connectionFormAiService: ConnectionFormAiService) {}

  register(): void {
    this.connectionFormAiService.optionsContainer.add(ConnectionAiScope, 0);
  }
}

export type ConnectionAiScopeService = ConnectionAiScopeServiceImpl;

export class ConnectionAiScopeServiceDI extends Context.Service<ConnectionAiScopeServiceDI, ConnectionAiScopeServiceImpl>()(
  '@cloudbeaver/plugin-connection-ai/connection-custom-scope/connection-ai-settings/ConnectionAiScopeService#ConnectionAiScopeService',
) {
  static readonly implementation = ConnectionAiScopeServiceImpl;

  static readonly dependencies = () => [ConnectionFormAiService] as const;
  static readonly make: Effect.Effect<ConnectionAiScopeServiceImpl, never, Context.Service.Identifier<typeof ConnectionFormAiService>> = Effect.gen(
    function* makeConnectionAiScopeService() {
      const connectionFormAiService = yield* ConnectionFormAiService;

      return new ConnectionAiScopeServiceImpl(connectionFormAiService);
    },
  );
  static readonly layer: Layer.Layer<ConnectionAiScopeServiceDI, never, Context.Service.Identifier<typeof ConnectionFormAiService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ConnectionAiScopeService = ConnectionAiScopeServiceDI;
