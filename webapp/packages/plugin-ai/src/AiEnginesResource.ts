/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { GraphQLService, type AiEngineConfig, type AiEngineInfo } from '@cloudbeaver/core-sdk';

export type EngineInfo = AiEngineInfo;
export type EngineConfig = AiEngineConfig;

export class AiEnginesResourceImpl extends CachedDataResource<EngineInfo[]> {
  constructor(
    private readonly graphQLService: GraphQLService,
    serverConfigResource: ServerConfigResource,
  ) {
    super(() => []);

    this.sync(serverConfigResource);
  }

  protected async loader(): Promise<EngineInfo[]> {
    const { engines } = await this.graphQLService.sdk.getEngines();
    return engines ?? [];
  }
}

export type AiEnginesResource = AiEnginesResourceImpl;

export class AiEnginesResourceDI extends Context.Service<AiEnginesResourceDI, AiEnginesResourceImpl>()(
  '@cloudbeaver/plugin-ai/AiEnginesResource#AiEnginesResource',
) {
  static readonly implementation = AiEnginesResourceImpl;

  static readonly dependencies = () => [GraphQLService, ServerConfigResource] as const;
  static readonly make: Effect.Effect<
    AiEnginesResourceImpl,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof ServerConfigResource>
  > = Effect.gen(function* makeAiEnginesResource() {
    const graphQLService = yield* GraphQLService;
    const serverConfigResource = yield* ServerConfigResource;

    return new AiEnginesResourceImpl(graphQLService, serverConfigResource);
  });
  static readonly layer: Layer.Layer<
    AiEnginesResourceDI,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof ServerConfigResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AiEnginesResource = AiEnginesResourceDI;
