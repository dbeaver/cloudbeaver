/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { CachedDataResource, DriverProviderInfo, GraphQLService } from '@cloudbeaver/core-sdk';

@injectable()
export class DBDriverProviderResource extends CachedDataResource<DriverProviderInfo[]> {
  constructor(
    private readonly serverConfigResource: ServerConfigResource,
    private readonly graphQLService: GraphQLService,
  ) {
    super(() => []);

    this.sync(this.serverConfigResource, () => { }, () => undefined);
  }

  protected async loader(): Promise<DriverProviderInfo[]> {
    const { driverProviders } = await this.graphQLService.sdk.driverProviderList();

    return driverProviders;
  }
}
