/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { GraphQLService, type ProductSettings } from '@cloudbeaver/core-sdk';

import { SessionDataResource } from '../SessionDataResource.js';

export type ServerSettings = ProductSettings;

@injectable()
export class ServerSettingsResource extends CachedDataResource<ServerSettings | null> {
  constructor(
    private readonly graphQLService: GraphQLService,
    sessionDataResource: SessionDataResource,
  ) {
    super(() => null, undefined, []);
    this.sync(sessionDataResource);
  }

  protected async loader(): Promise<ServerSettings> {
    const { settings } = await this.graphQLService.sdk.getProductSettings();
    return settings as ServerSettings;
  }
}
