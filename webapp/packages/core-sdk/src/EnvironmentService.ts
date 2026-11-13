/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { GlobalConstants } from '@cloudbeaver/core-utils';

export class EnvironmentServiceImpl {
  readonly gqlEndpoint = GlobalConstants.absoluteServiceHTTPUrl('gql');
  readonly wsEndpoint = GlobalConstants.absoluteServiceWSUrl('ws');
}

export type EnvironmentService = EnvironmentServiceImpl;

export class EnvironmentServiceDI extends Context.Service<EnvironmentServiceDI, EnvironmentServiceImpl>()(
  '@cloudbeaver/core-sdk/EnvironmentService#EnvironmentService',
) {
  static readonly implementation = EnvironmentServiceImpl;

  static readonly dependencies = () => [] as const;
  static readonly make: Effect.Effect<EnvironmentServiceImpl, never, never> = Effect.sync(() => new EnvironmentServiceImpl());
  static readonly layer: Layer.Layer<EnvironmentServiceDI, never, never> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const EnvironmentService = EnvironmentServiceDI;
