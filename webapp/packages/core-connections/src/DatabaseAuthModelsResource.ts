/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import {
  DatabaseAuthModel,
  GraphQLService,
  CachedMapResource,
  resourceKeyList
} from '@cloudbeaver/core-sdk';

@injectable()
export class DatabaseAuthModelsResource extends CachedMapResource<string, DatabaseAuthModel> {
  constructor(private readonly graphQLService: GraphQLService) {
    super();
  }

  protected async loader(key: string): Promise<Map<string, DatabaseAuthModel>> {
    const { models } = await this.graphQLService.sdk.getAuthModels();

    this.set(resourceKeyList(models.map(model => model.id)), models);

    return this.data;
  }
}