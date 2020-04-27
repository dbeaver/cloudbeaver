/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@dbeaver/core/di';
import { GraphQLService, ServerConfig, CachedResource } from '@dbeaver/core/sdk';

@injectable()
export class ServerService {
  config = new CachedResource(undefined, this.refreshConfigAsync.bind(this));

  constructor(private graphQLService: GraphQLService) {
  }

  private async refreshConfigAsync(data: ServerConfig | undefined): Promise<ServerConfig> {
    if (data) {
      return data;
    }

    const { serverConfig } = await this.graphQLService.gql.serverConfig();

    return serverConfig;
  }
}
