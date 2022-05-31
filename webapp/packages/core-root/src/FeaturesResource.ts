/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import {
  GraphQLService,
  CachedDataResource,
  WebFeatureSet
} from '@cloudbeaver/core-sdk';

import { ServerConfigResource } from './ServerConfigResource';

export type ApplicationFeature = WebFeatureSet;

@injectable()
export class FeaturesResource extends CachedDataResource<ApplicationFeature[], void | any> {
  constructor(
    private readonly graphQLService: GraphQLService,
    serverConfigResource: ServerConfigResource
  ) {
    super([]);

    this.sync(serverConfigResource, () => {}, () => {});
  }

  protected async loader(): Promise<ApplicationFeature[]> {
    const { features } = await this.graphQLService.sdk.listFeatureSets();

    return features;
  }
}
