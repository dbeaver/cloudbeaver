/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { GraphQLService, type WebFeatureSet } from '@cloudbeaver/core-sdk';

import { EAdminPermission } from './EAdminPermission.js';
import { SessionPermissionsResource } from './SessionPermissionsResource.js';

export type ApplicationFeature = WebFeatureSet;

@injectable()
export class FeaturesResource extends CachedDataResource<ApplicationFeature[]> {
  private baseFeatures: string[];

  constructor(
    private readonly graphQLService: GraphQLService,
    permissionsResource: SessionPermissionsResource,
  ) {
    super(() => []);

    this.baseFeatures = [];
    permissionsResource.require(this, EAdminPermission.admin).outdateResource(this);

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

export function sortFeature(a: ApplicationFeature, b: ApplicationFeature): number {
  return a.label.localeCompare(b.label);
}
