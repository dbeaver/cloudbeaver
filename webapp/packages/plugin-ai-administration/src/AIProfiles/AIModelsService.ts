/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { GraphQLService, type AiEngineConfig, type AiModelInfo } from '@cloudbeaver/core-sdk';

@injectable(() => [GraphQLService])
export class AIModelsService {
  constructor(private readonly graphQLService: GraphQLService) {}

  async load(engineId: string, profileId?: string, settings?: AiEngineConfig): Promise<AiModelInfo[]> {
    const { models } = await this.graphQLService.sdk.getEngineModels({ engineId, profileId, settings });
    return models;
  }
}
