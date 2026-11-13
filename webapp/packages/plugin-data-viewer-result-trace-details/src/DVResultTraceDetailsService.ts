/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { GraphQLService } from '@cloudbeaver/core-sdk';

export class DVResultTraceDetailsServiceImpl {
  constructor(private readonly graphQLService: GraphQLService) {}

  async getTraceDetails(projectId: string, connectionId: string, contextId: string, resultsId: string) {
    const trace = await this.graphQLService.sdk.getSqlDynamicTrace({
      projectId,
      connectionId,
      contextId,
      resultsId,
    });

    return trace;
  }
}

export type DVResultTraceDetailsService = DVResultTraceDetailsServiceImpl;

export class DVResultTraceDetailsServiceDI extends Context.Service<DVResultTraceDetailsServiceDI, DVResultTraceDetailsServiceImpl>()(
  '@cloudbeaver/plugin-data-viewer-result-trace-details/DVResultTraceDetailsService#DVResultTraceDetailsService',
) {
  static readonly implementation = DVResultTraceDetailsServiceImpl;

  static readonly dependencies = () => [GraphQLService] as const;
  static readonly make: Effect.Effect<DVResultTraceDetailsServiceImpl, never, Context.Service.Identifier<typeof GraphQLService>> = Effect.gen(
    function* makeDVResultTraceDetailsService() {
      const graphQLService = yield* GraphQLService;

      return new DVResultTraceDetailsServiceImpl(graphQLService);
    },
  );
  static readonly layer: Layer.Layer<DVResultTraceDetailsServiceDI, never, Context.Service.Identifier<typeof GraphQLService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DVResultTraceDetailsService = DVResultTraceDetailsServiceDI;
