/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { GraphQLService, CachedDataResource, ServerConfig } from '@cloudbeaver/core-sdk';

@injectable()
export class ServerConfigResource extends CachedDataResource<ServerConfig | null, null> {
  constructor(
    private graphQLService: GraphQLService,
  ) {
    super(null);
  }

  isLoaded() {
    return !!this.data;
  }

  async update() {
    await this.refresh(null);
  }

  protected async loader(key: null): Promise<ServerConfig> {
    const { serverConfig } = await this.graphQLService.sdk.serverConfig();

    this.markUpdated(key);
    return serverConfig;
  }
}
