/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { DBSource } from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';
import { EPermission, PermissionsService } from '@cloudbeaver/core-root';
import { GraphQLService, CachedDataResource } from '@cloudbeaver/core-sdk';

@injectable()
export class DataSourcesResource extends CachedDataResource<DBSource[], null> {
  constructor(
    private graphQLService: GraphQLService,
    private permissionsService: PermissionsService
  ) {
    super([]);
  }

  isLoaded() {
    return !!this.data.length;
  }

  protected async loader(): Promise<DBSource[]> {
    if (!await this.permissionsService.hasAsync(EPermission.public)) {
      return [];
    }
    const { dataSourceList } = await this.graphQLService.gql.dataSourceList();
    return dataSourceList;
  }
}
