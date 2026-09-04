/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import {
  GraphQLService,
  type AiAdminConfigurationProfileInfo,
  type AiConfigurationProfileInput,
  type AiEngineConfig,
  type AiModelInfo,
} from '@cloudbeaver/core-sdk';
import { AISettingsResource } from '@cloudbeaver/plugin-ai';
import { AIProfilesResource } from '@cloudbeaver/plugin-ai-profiles';

export type AIAdminProfile = AiAdminConfigurationProfileInfo;
export type AIProfileInput = AiConfigurationProfileInput;

// TODO do we need this service?
@injectable(() => [GraphQLService, AIProfilesResource, AISettingsResource])
export class AIProfilesAdministrationService {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly aiProfilesResource: AIProfilesResource,
    private readonly aiSettingsResource: AISettingsResource,
  ) {}

  async create(config: AIProfileInput): Promise<AIAdminProfile> {
    const { profile } = await this.graphQLService.sdk.createAiProfile({ config });
    this.aiProfilesResource.setProfile(profile);
    this.aiSettingsResource.markOutdated();
    return profile;
  }

  async update(config: AIProfileInput): Promise<AIAdminProfile> {
    const { profile } = await this.graphQLService.sdk.updateAiProfile({ config });
    this.aiProfilesResource.setProfile(profile);
    this.aiSettingsResource.markOutdated();
    return profile;
  }

  async delete(profileId: string): Promise<void> {
    await this.graphQLService.sdk.deleteAiProfile({ profileId });
    this.aiProfilesResource.removeProfile(profileId);
    this.aiSettingsResource.markOutdated();
  }

  async loadModels(engineId: string, profileId?: string, settings?: AiEngineConfig): Promise<AiModelInfo[]> {
    const { models } = await this.graphQLService.sdk.getEngineModels({ engineId, profileId, settings });
    return models;
  }
}
