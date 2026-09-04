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
  GraphQLService,
} from '@cloudbeaver/core-sdk';

export type AIProfile = AiConfigurationProfileInfo;

@injectable(() => [GraphQLService, ServerConfigResource, WorkspaceConfigEventHandler, UserInfoResource])
export class AIProfilesResource extends CachedMapResource<string, AIProfile> {
  constructor(
    private readonly graphQLService: GraphQLService,
    serverConfigResource: ServerConfigResource,
    workspaceConfigEventHandler: WorkspaceConfigEventHandler,
    userInfoResource: UserInfoResource,
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
    const { profile } = await this.graphQLService.sdk.createAiProfile({ config });
    this.set(profile.id, { ...profile, credentialsSaved: false });
    return profile;
  }

  async updateProfile(config: AiConfigurationProfileInput): Promise<AiAdminConfigurationProfileInfo> {
    const { profile } = await this.graphQLService.sdk.updateAiProfile({ config });
    this.set(profile.id, { ...profile, credentialsSaved: this.get(profile.id)?.credentialsSaved ?? false });
    return profile;
  }

  async deleteProfile(profileId: string): Promise<void> {
    await this.graphQLService.sdk.deleteAiProfile({ profileId });
    this.delete(profileId);
  }

  saveCredentials(profileId: string, token: string): Promise<void> {
    return this.updateCredentials(profileId, token, true);
  }

  resetCredentials(profileId: string): Promise<void> {
    return this.updateCredentials(profileId, '', false);
  }

  protected async loader(): Promise<Map<string, AIProfile>> {
    const { profiles } = await this.graphQLService.sdk.getAiProfiles();
    this.replace(resourceKeyList(profiles.map(profile => profile.id)), profiles);
    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }

  private async updateCredentials(profileId: string, token: string, credentialsSaved: boolean): Promise<void> {
    await this.graphQLService.sdk.saveAiProfileCredentials({
      profileId,
      credentials: { properties: { token } },
    });

    const profile = this.get(profileId);
    if (profile) {
      this.set(profileId, { ...profile, credentialsSaved });
    }
    this.markOutdated(profileId);
  }
}
