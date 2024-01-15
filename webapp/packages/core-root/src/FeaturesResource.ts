/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { CachedDataResource, EAdminPermission } from '@cloudbeaver/core-resource';
import { GraphQLService, WebFeatureSet } from '@cloudbeaver/core-sdk';

import { SessionPermissionsResource } from './SessionPermissionsResource';

export type ApplicationFeature = WebFeatureSet;

@injectable()
export class FeaturesResource extends CachedDataResource<ApplicationFeature[]> {
  constructor(private readonly graphQLService: GraphQLService, permissionsResource: SessionPermissionsResource) {
    super(() => []);

    permissionsResource.require(this, EAdminPermission.admin).outdateResource(this);
  }

  protected async loader(): Promise<ApplicationFeature[]> {
    const { features } = await this.graphQLService.sdk.listFeatureSets();

    return features;
  }
}
