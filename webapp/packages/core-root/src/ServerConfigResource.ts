/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { GraphQLService, CachedDataResource, ServerConfig } from '@cloudbeaver/core-sdk';

@injectable()
export class ServerConfigResource extends CachedDataResource<ServerConfig | null, void> {
  constructor(
    private graphQLService: GraphQLService
  ) {
    super(null);
  }

  async update(): Promise<void> {
    await this.refresh();
  }

  protected async loader(): Promise<ServerConfig> {
    const { serverConfig } = await this.graphQLService.sdk.serverConfig();

    return serverConfig;
  }
}
