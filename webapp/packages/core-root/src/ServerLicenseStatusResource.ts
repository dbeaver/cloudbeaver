/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { GraphQLService, type ServerLicenseStatusFragment } from '@cloudbeaver/core-sdk';

import { ServerConfigResource } from './ServerConfigResource.js';

export type ServerLicenseStatus = ServerLicenseStatusFragment;

@injectable()
export class ServerLicenseStatusResource extends CachedDataResource<ServerLicenseStatus | null> {
  constructor(
    private readonly graphQLService: GraphQLService,
    serverConfigResource: ServerConfigResource,
  ) {
    super(() => null, undefined, []);
    this.sync(serverConfigResource);
  }

  get licenseRequired(): boolean {
    return this.data?.licenseRequired ?? false;
  }

  get licenseValid(): boolean {
    return this.data?.licenseValid ?? false;
  }

  protected async loader(): Promise<ServerLicenseStatus> {
    const { licenseStatus } = await this.graphQLService.sdk.getServerLicenseStatus();

    return licenseStatus;
  }
}
