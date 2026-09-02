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
  type AiConfigurationProfileInput,
  type AiModelInfo,
} from '@cloudbeaver/core-sdk';
import { type AIProfile, UserAIProfileResource } from '@cloudbeaver/plugin-ai';

import { AISettingsResource } from '../AISettingsResource.js';

export type AIAdminProfile = AiAdminConfigurationProfileInfo;
export type AIProfileInput = AiConfigurationProfileInput;

@injectable(() => [GraphQLService, SessionPermissionsResource, ServerConfigResource, AISettingsResource, UserAIProfileResource])
export class AIAdminProfilesResource extends CachedMapResource<string, AIProfile> {
  constructor(
    private readonly graphQLService: GraphQLService,
    permissionsResource: SessionPermissionsResource,
    serverConfigResource: ServerConfigResource,
    aiSettingsResource: AISettingsResource,
    private readonly userAIProfileResource: UserAIProfileResource,
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

    this.userAIProfileResource.setProfile(profile);
    this.set(profile.id, this.userAIProfileResource.get(profile.id)!);

    return profile;
  }

  async update(config: AIProfileInput): Promise<AIAdminProfile> {
    const { profile } = await this.graphQLService.sdk.updateAiProfile({ config });

    this.userAIProfileResource.setProfile(profile);
    this.set(profile.id, this.userAIProfileResource.get(profile.id)!);

    return profile;
  }

  async deleteProfile(profileId: string): Promise<void> {
    await this.graphQLService.sdk.deleteAiProfile({ profileId });

    this.userAIProfileResource.removeProfile(profileId);
    this.delete(profileId);
  }

  async loadModels(engineId: string, profileId?: string, settings?: AiEngineConfig): Promise<AiModelInfo[]> {
    const { models } = await this.graphQLService.sdk.getEngineModels({ engineId, profileId, settings });
    return models;
  }

  protected async loader(): Promise<Map<string, AIProfile>> {
    await this.userAIProfileResource.refresh(CachedMapAllKey);
    const profiles = this.userAIProfileResource.values;

    const key = resourceKeyList(profiles.map(profile => profile.id));
    this.replace(key, profiles);

    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}
