/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { GraphQLService, ServerConfig, CachedResource } from '@cloudbeaver/core-sdk';
import { ServerSettingsService } from '@cloudbeaver/core-settings';
import { parseJSONFlat } from '@cloudbeaver/core-utils';

import { SessionService } from './SessionService';

@injectable()
export class ServerService {
  readonly config = new CachedResource(undefined, this.refreshConfigAsync.bind(this), data => !!data);
  readonly settings = new ServerSettingsService(this.sessionService.settings);

  private lastConfig: any = null
  constructor(
    private graphQLService: GraphQLService,
    private sessionService: SessionService,
  ) {
  }

  private async refreshConfigAsync(data: ServerConfig | undefined): Promise<ServerConfig> {
    const { serverConfig } = await this.graphQLService.gql.serverConfig();

    if (serverConfig.productConfiguration !== this.lastConfig) {
      this.lastConfig = serverConfig.productConfiguration;
      this.settings.clear();
      parseJSONFlat(
        serverConfig.productConfiguration,
        this.settings.setSelfValue.bind(this.settings)
      );
    }
    return serverConfig;
  }
}
