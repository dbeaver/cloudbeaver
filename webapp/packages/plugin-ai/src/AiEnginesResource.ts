/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { GraphQLService, type AiEngineConfig, type AiEngineInfo } from '@cloudbeaver/core-sdk';

export type EngineInfo = AiEngineInfo;
export type EngineConfig = AiEngineConfig;

@injectable(() => [GraphQLService, ServerConfigResource])
export class AiEnginesResource extends CachedDataResource<EngineInfo[]> {
  constructor(
    private readonly graphQLService: GraphQLService,
    serverConfigResource: ServerConfigResource,
  ) {
    super(() => []);

    this.sync(serverConfigResource);
  }

  protected async loader(): Promise<EngineInfo[]> {
    const { engines } = await this.graphQLService.sdk.getEngines();
    return engines ?? [];
  }
}
