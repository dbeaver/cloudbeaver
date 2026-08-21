/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { CachedMapAllKey, CachedMapResource, resourceKeyList } from '@cloudbeaver/core-resource';
import { EAdminPermission, ServerConfigResource, SessionPermissionsResource } from '@cloudbeaver/core-root';
import {
  GraphQLService,
  type AiEngineConfig,
  type AiAdminConfigurationProfileInfo,
  type AiConfigurationProfileInfo,
  type AiConfigurationProfileInput,
  type AiModelInfo,
} from '@cloudbeaver/core-sdk';

import { AISettingsResource } from '../AISettingsResource.js';

export type AIProfile = AiConfigurationProfileInfo;
export type AIAdminProfile = AiAdminConfigurationProfileInfo;
export type AIProfileInput = AiConfigurationProfileInput;

@injectable(() => [GraphQLService, SessionPermissionsResource, ServerConfigResource, AISettingsResource])
export class AIProfilesResource extends CachedMapResource<string, AIProfile> {
  constructor(
    private readonly graphQLService: GraphQLService,
    permissionsResource: SessionPermissionsResource,
    serverConfigResource: ServerConfigResource,
    aiSettingsResource: AISettingsResource,
  ) {
    super();

    this.sync(
      serverConfigResource,
      () => undefined,
      () => CachedMapAllKey,
    );

    permissionsResource.require(this, EAdminPermission.admin).outdateResource(this);

    this.onItemDelete.addHandler(() => aiSettingsResource.markOutdated());
    this.onItemUpdate.addHandler(() => aiSettingsResource.markOutdated());
  }

  async create(config: AIProfileInput): Promise<AIAdminProfile> {
    const { profile } = await this.graphQLService.sdk.createAiProfile({ config });

    this.set(profile.id, profile);

    return profile;
  }

  async update(config: AIProfileInput): Promise<AIAdminProfile> {
    const { profile } = await this.graphQLService.sdk.updateAiProfile({ config });

    this.set(profile.id, profile);

    return profile;
  }

  async deleteProfile(profileId: string): Promise<void> {
    await this.graphQLService.sdk.deleteAiProfile({ profileId });

    this.delete(profileId);
  }

  async loadModels(engineId: string, profileId?: string, settings?: AiEngineConfig): Promise<AiModelInfo[]> {
    const { models } = await this.graphQLService.sdk.getEngineModels({ engineId, profileId, settings });
    return models;
  }

  protected async loader(): Promise<Map<string, AIProfile>> {
    const { profiles } = await this.graphQLService.sdk.getAiProfiles();

    const key = resourceKeyList(profiles.map(profile => profile.id));
    this.replace(key, profiles);

    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}
