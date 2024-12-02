/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { GraphQLService, type ResourceQuotasFragment } from '@cloudbeaver/core-sdk';

import { ServerConfigResource } from './ServerConfigResource.js';

export type ServerResourceQuotas = ResourceQuotasFragment['resourceQuotas'];

@injectable()
export class ServerResourceQuotasResource extends CachedDataResource<ServerResourceQuotas | null> {
  constructor(
    private readonly graphQLService: GraphQLService,
    serverConfigResource: ServerConfigResource,
  ) {
    super(() => null, undefined, []);
    this.sync(serverConfigResource);
  }

  protected async loader(): Promise<ResourceQuotasFragment> {
    const { resourceQuotas } = await this.graphQLService.sdk.getServerResourceQuotas();

    return resourceQuotas.resourceQuotas;
  }
}
