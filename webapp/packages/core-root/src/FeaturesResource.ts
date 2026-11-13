/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { GraphQLService, type WebFeatureSet } from '@cloudbeaver/core-sdk';

import { EAdminPermission } from './EAdminPermission.js';
import { SessionPermissionsResource } from './SessionPermissionsResource.js';

export type ApplicationFeature = WebFeatureSet;

export class FeaturesResourceImpl extends CachedDataResource<ApplicationFeature[]> {
  private baseFeatures: string[];

  constructor(
    private readonly graphQLService: GraphQLService,
    sessionPermissionsResource: SessionPermissionsResource,
  ) {
    super(() => []);

    this.baseFeatures = [];
    sessionPermissionsResource.require(this, EAdminPermission.admin).outdateResource(this);

    makeObservable<this, 'baseFeatures'>(this, {
      baseFeatures: observable,
    });
  }

  isBase(id: string) {
    return this.baseFeatures.includes(id);
  }

  setBaseFeatures(features: string[]) {
    this.baseFeatures = features;
  }

  protected async loader(): Promise<ApplicationFeature[]> {
    const { features } = await this.graphQLService.sdk.listFeatureSets();

    return features;
  }
}

export type FeaturesResource = FeaturesResourceImpl;

export class FeaturesResourceDI extends Context.Service<FeaturesResourceDI, FeaturesResourceImpl>()(
  '@cloudbeaver/core-root/FeaturesResource#FeaturesResource',
) {
  static readonly implementation = FeaturesResourceImpl;

  static readonly dependencies = () => [GraphQLService, SessionPermissionsResource] as const;
  static readonly make: Effect.Effect<
    FeaturesResourceImpl,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof SessionPermissionsResource>
  > = Effect.gen(function* makeFeaturesResource() {
    const graphQLService = yield* GraphQLService;
    const sessionPermissionsResource = yield* SessionPermissionsResource;

    return new FeaturesResourceImpl(graphQLService, sessionPermissionsResource);
  });
  static readonly layer: Layer.Layer<
    FeaturesResourceDI,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof SessionPermissionsResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const FeaturesResource = FeaturesResourceDI;

export function sortFeature(a: ApplicationFeature, b: ApplicationFeature): number {
  return a.label.localeCompare(b.label);
}
