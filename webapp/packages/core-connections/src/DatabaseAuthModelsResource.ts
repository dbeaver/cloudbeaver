/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { CachedMapAllKey, CachedMapResource, resourceKeyList } from '@cloudbeaver/core-resource';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { type DatabaseAuthModel as DatabaseAuthModelBase, GraphQLService } from '@cloudbeaver/core-sdk';

export type DatabaseAuthModel = DatabaseAuthModelBase;

@injectable()
export class DatabaseAuthModelsResource extends CachedMapResource<string, DatabaseAuthModel> {
  constructor(
    private readonly graphQLService: GraphQLService,
    serverConfigResource: ServerConfigResource,
  ) {
    super();
    this.sync(
      serverConfigResource,
      () => {},
      () => CachedMapAllKey,
    );
  }

  protected async loader(): Promise<Map<string, DatabaseAuthModel>> {
    const { models } = await this.graphQLService.sdk.getAuthModels();

    this.replace(resourceKeyList(models.map(model => model.id)), models);

    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}
