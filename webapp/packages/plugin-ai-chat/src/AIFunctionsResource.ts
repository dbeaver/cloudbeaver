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
import { type AiFunction, GraphQLService } from '@cloudbeaver/core-sdk';

export class AIFunctionsResourceImpl extends CachedDataResource<AiFunction[]> {
  constructor(
    private readonly graphQLService: GraphQLService,
    serverConfigResource: ServerConfigResource,
  ) {
    super(() => []);
    this.sync(serverConfigResource);
  }

  protected async loader(): Promise<AiFunction[]> {
    const { functions } = await this.graphQLService.sdk.getAiFunctions();
    return functions ?? [];
  }
}

export type AIFunctionsResource = AIFunctionsResourceImpl;

export class AIFunctionsResourceDI extends Context.Service<AIFunctionsResourceDI, AIFunctionsResourceImpl>()(
  '@cloudbeaver/plugin-ai-chat/AIFunctionsResource#AIFunctionsResource',
) {
  static readonly implementation = AIFunctionsResourceImpl;

  static readonly dependencies = () => [GraphQLService, ServerConfigResource] as const;
  static readonly make: Effect.Effect<
    AIFunctionsResourceImpl,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof ServerConfigResource>
  > = Effect.gen(function* makeAIFunctionsResource() {
    const graphQLService = yield* GraphQLService;
    const serverConfigResource = yield* ServerConfigResource;

    return new AIFunctionsResourceImpl(graphQLService, serverConfigResource);
  });
  static readonly layer: Layer.Layer<
    AIFunctionsResourceDI,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof ServerConfigResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AIFunctionsResource = AIFunctionsResourceDI;
