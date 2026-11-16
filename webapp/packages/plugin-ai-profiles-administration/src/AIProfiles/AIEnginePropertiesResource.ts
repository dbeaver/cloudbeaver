/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { runInAction } from 'mobx';

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CachedMapResource, ResourceKeyUtils, type ResourceKeySimple } from '@cloudbeaver/core-resource';
import { EAdminPermission, SessionPermissionsResource } from '@cloudbeaver/core-root';
import { GraphQLService, type AiEngineConfig, type AiModelInfo, type IObjectPropertyInfo } from '@cloudbeaver/core-sdk';

export const MODEL_PROPERTY_ID = 'model';
export const CONTEXT_WINDOW_SIZE_PROPERTY_ID = 'contextWindowSize';
export const TEMPERATURE_PROPERTY_ID = 'temperature';

export class AIEnginePropertiesResourceImpl extends CachedMapResource<string, IObjectPropertyInfo[]> {
  constructor(
    private readonly graphQLService: GraphQLService,
    sessionPermissionsResource: SessionPermissionsResource,
  ) {
    super(() => new Map(), []);

    sessionPermissionsResource.require(this, EAdminPermission.admin).outdateResource(this);
  }

  async loadProperties(engineId: string, profileId?: string, settings?: AiEngineConfig): Promise<IObjectPropertyInfo[]> {
    const { properties } = await this.graphQLService.sdk.getEngineProperties({ engineId, profileId, settings });
    return properties;
  }

  async loadModels(engineId: string, profileId?: string, settings?: AiEngineConfig): Promise<AiModelInfo[]> {
    const { models } = await this.graphQLService.sdk.getEngineModels({ engineId, profileId, settings });
    return models;
  }

  protected async loader(originalKey: ResourceKeySimple<string>): Promise<Map<string, IObjectPropertyInfo[]>> {
    await ResourceKeyUtils.forEachAsync(originalKey, async engineId => {
      const { properties } = await this.graphQLService.sdk.getEngineProperties({ engineId });

      runInAction(() => {
        this.set(engineId, properties);
      });
    });

    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}

export type AIEnginePropertiesResource = AIEnginePropertiesResourceImpl;

export class AIEnginePropertiesResourceDI extends Context.Service<AIEnginePropertiesResourceDI, AIEnginePropertiesResourceImpl>()(
  '@cloudbeaver/plugin-ai-profiles-administration/AIProfiles/AIEnginePropertiesResource#AIEnginePropertiesResource',
) {
  static readonly implementation = AIEnginePropertiesResourceImpl;

  static readonly dependencies = () => [GraphQLService, SessionPermissionsResource] as const;
  static readonly make: Effect.Effect<
    AIEnginePropertiesResourceImpl,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof SessionPermissionsResource>
  > = Effect.gen(function* makeAIEnginePropertiesResource() {
    const graphQLService = yield* GraphQLService;
    const sessionPermissionsResource = yield* SessionPermissionsResource;

    return new AIEnginePropertiesResourceImpl(graphQLService, sessionPermissionsResource);
  });
  static readonly layer: Layer.Layer<
    AIEnginePropertiesResourceDI,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof SessionPermissionsResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AIEnginePropertiesResource = AIEnginePropertiesResourceDI;
