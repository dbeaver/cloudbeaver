/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { CachedMapAllKey, CachedMapResource, resourceKeyList } from '@cloudbeaver/core-resource';
import { ServerConfigResource, ServerEventId, WorkspaceConfigEventHandler } from '@cloudbeaver/core-root';
import {
  type AiAdminConfigurationProfileInfo,
  type AiConfigurationProfileInfo,
  type AiConfigurationProfileInput,
  type AiDeviceAuthorizationInfo,
  type AiProfileCredentialsInput,
  GraphQLService,
} from '@cloudbeaver/core-sdk';
import { AISettingsResource } from '@cloudbeaver/plugin-ai';

export type AIProfile = AiConfigurationProfileInfo;

@injectable(() => [GraphQLService, ServerConfigResource, WorkspaceConfigEventHandler, UserInfoResource, AISettingsResource])
export class AIProfilesResource extends CachedMapResource<string, AIProfile> {
  constructor(
    private readonly graphQLService: GraphQLService,
    serverConfigResource: ServerConfigResource,
    workspaceConfigEventHandler: WorkspaceConfigEventHandler,
    userInfoResource: UserInfoResource,
    private readonly aiSettingsResource: AISettingsResource,
  ) {
    super();

    this.sync(
      serverConfigResource,
      () => undefined,
      () => CachedMapAllKey,
    );

    workspaceConfigEventHandler.onEvent(ServerEventId.CbWorkspaceConfigChanged, () => this.markOutdated(CachedMapAllKey), undefined, this);
    userInfoResource.onUserChange.addHandler(() => this.markOutdated(CachedMapAllKey));
  }

  async createProfile(config: AiConfigurationProfileInput): Promise<AiAdminConfigurationProfileInfo> {
    const firstProfile = this.values.length === 0;
    const { profile } = await this.graphQLService.sdk.createAiProfile({ config });
    this.set(profile.id, profile);
    if (firstProfile) {
      this.aiSettingsResource.markOutdated();
    }
    return profile;
  }

  async updateProfile(config: AiConfigurationProfileInput): Promise<AiAdminConfigurationProfileInfo> {
    const { profile } = await this.graphQLService.sdk.updateAiProfile({ config });
    this.set(profile.id, profile);
    return profile;
  }

  async deleteProfile(profileId: string): Promise<void> {
    await this.graphQLService.sdk.deleteAiProfile({ profileId });
    this.delete(profileId);
  }

  saveCredentials(profileId: string, token: string, accountAuthentication = false): Promise<void> {
    return this.updateCredentials(profileId, {
      properties: !accountAuthentication && token ? { token } : {},
      accountAuthentication,
    });
  }

  resetCredentials(profileId: string): Promise<void> {
    return this.updateCredentials(profileId, { properties: { token: '' } });
  }

  async disconnectAccount(profileId: string): Promise<void> {
    await this.graphQLService.sdk.disconnectAiAccount({ profileId });
    this.markOutdated(profileId);
  }

  async startDeviceAuthorization(profileId: string): Promise<AiDeviceAuthorizationInfo> {
    const { authorization } = await this.graphQLService.sdk.startAiDeviceAuthorization({ profileId });
    return authorization;
  }

  protected async loader(): Promise<Map<string, AIProfile>> {
    const { profiles } = await this.graphQLService.sdk.getAiProfiles();
    this.replace(resourceKeyList(profiles.map(profile => profile.id)), profiles);
    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }

  private async updateCredentials(profileId: string, credentials: AiProfileCredentialsInput): Promise<void> {
    await this.graphQLService.sdk.saveAiProfileCredentials({
      profileId,
      credentials,
    });

    this.markOutdated(profileId);
  }
}

export function compareAIProfiles(a: AIProfile, b: AIProfile): number {
  return a.name.localeCompare(b.name);
}
