/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { CustomGraphQLClient } from './CustomGraphQLClient.js';
import { EnvironmentService } from './EnvironmentService.js';
import { uploadBlobResultSetExtension } from './Extensions/uploadBlobResultSetExtension.js';
import { uploadDriverLibraryExtension } from './Extensions/uploadDriverLibraryExtension.js';
import { uploadResultDataExtension } from './Extensions/uploadResultDataExtension.js';
import type { IResponseInterceptor } from './IResponseInterceptor.js';
import { getSdk, type Sdk } from './sdk.js';

function extendedSDK(
  client: CustomGraphQLClient,
): Sdk &
  ReturnType<typeof uploadDriverLibraryExtension> &
  ReturnType<typeof uploadBlobResultSetExtension> &
  ReturnType<typeof uploadResultDataExtension> {
  const sdk = getSdk(client);

  return {
    ...sdk,
    ...uploadDriverLibraryExtension(client),
    ...uploadBlobResultSetExtension(client),
    ...uploadResultDataExtension(client),
  };
}

export class GraphQLServiceImpl {
  sdk: ReturnType<typeof extendedSDK>;

  readonly client: CustomGraphQLClient;

  constructor(private readonly environmentService: EnvironmentService) {
    const gqlEndpoint = this.environmentService.gqlEndpoint;
    this.client = new CustomGraphQLClient(gqlEndpoint);
    this.sdk = extendedSDK(this.client);
  }

  registerInterceptor(interceptor: IResponseInterceptor): void {
    this.client.registerInterceptor(interceptor);
  }

  enableRequests(): void {
    this.client.enableRequests();
  }

  blockRequests(reason: Error | string): void {
    this.client.blockRequests(reason);
  }
}

export type GraphQLService = GraphQLServiceImpl;

export class GraphQLServiceDI extends Context.Service<GraphQLServiceDI, GraphQLServiceImpl>()('@cloudbeaver/core-sdk/GraphQLService#GraphQLService') {
  static readonly implementation = GraphQLServiceImpl;

  static readonly dependencies = () => [EnvironmentService] as const;
  static readonly make: Effect.Effect<GraphQLServiceImpl, never, Context.Service.Identifier<typeof EnvironmentService>> = Effect.gen(
    function* makeGraphQLService() {
      const environmentService = yield* EnvironmentService;

      return new GraphQLServiceImpl(environmentService);
    },
  );
  static readonly layer: Layer.Layer<GraphQLServiceDI, never, Context.Service.Identifier<typeof EnvironmentService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const GraphQLService = GraphQLServiceDI;
