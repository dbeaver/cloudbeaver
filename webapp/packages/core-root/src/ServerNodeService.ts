/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { Executor, type IExecutor } from '@cloudbeaver/core-executor';
import { GraphQLService, type WsSocketConnectedEvent } from '@cloudbeaver/core-sdk';

import { ServerNodeError } from './ServerNodeError.js';
import { ServerEventId, SessionEventSource } from './SessionEventSource.js';

export class ServerNodeServiceImpl {
  private applicationRunId: string | null;
  onApplicationRunIdChange: IExecutor;
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly sessionEventSource: SessionEventSource,
  ) {
    this.onApplicationRunIdChange = new Executor();
    this.applicationRunId = null;
    this.sessionEventSource.onEvent<WsSocketConnectedEvent>(ServerEventId.CbSessionWebsocketConnected, data => {
      this.applicationRunIdChanged(data.applicationRunId);
    });
  }

  private applicationRunIdChanged(applicationRunId: string): void {
    if (this.applicationRunId === null) {
      this.applicationRunId = applicationRunId;
      return;
    }

    if (this.applicationRunId === applicationRunId) {
      return;
    }

    this.applicationRunId = applicationRunId;
    this.graphQLService.blockRequests(new ServerNodeError('Server node changed'));
    this.sessionEventSource.disconnect();
    this.onApplicationRunIdChange.execute();
  }
}

export type ServerNodeService = ServerNodeServiceImpl;

export class ServerNodeServiceDI extends Context.Service<ServerNodeServiceDI, ServerNodeServiceImpl>()(
  '@cloudbeaver/core-root/ServerNodeService#ServerNodeService',
) {
  static readonly implementation = ServerNodeServiceImpl;

  static readonly dependencies = () => [GraphQLService, SessionEventSource] as const;
  static readonly make: Effect.Effect<
    ServerNodeServiceImpl,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof SessionEventSource>
  > = Effect.gen(function* makeServerNodeService() {
    const graphQLService = yield* GraphQLService;
    const sessionEventSource = yield* SessionEventSource;

    return new ServerNodeServiceImpl(graphQLService, sessionEventSource);
  });
  static readonly layer: Layer.Layer<
    ServerNodeServiceDI,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof SessionEventSource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ServerNodeService = ServerNodeServiceDI;
