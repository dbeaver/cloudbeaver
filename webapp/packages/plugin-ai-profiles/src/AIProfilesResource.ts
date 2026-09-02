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
import { type AiConfigurationProfileInfo, GraphQLService } from '@cloudbeaver/core-sdk';

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

  setProfile(profile: Omit<AIProfile, 'credentialsSaved'> & Partial<Pick<AIProfile, 'credentialsSaved'>>): void {
    this.set(profile.id, {
      ...profile,
      credentialsSaved: profile.credentialsSaved ?? this.get(profile.id)?.credentialsSaved ?? false,
    });
  }

  removeProfile(profileId: string): void {
    this.delete(profileId);
  }

  setCredentialsSaved(profileId: string, credentialsSaved: boolean): void {
    const profile = this.get(profileId);
    if (profile) {
      this.set(profileId, { ...profile, credentialsSaved });
    }
  }

  saveCredentials(profileId: string, token: string): Promise<boolean> {
    if (!token) {
      return Promise.resolve(false);
    }

    const profile = this.get(profileId);
    if (!profile || profile.global) {
      return Promise.resolve(false);
    }
    return this.updateCredentials(profileId, token, true);
  }

  resetCredentials(profileId: string): Promise<boolean> {
    const profile = this.get(profileId);
    if (!profile || profile.global) {
      return Promise.resolve(false);
    }
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

  private async updateCredentials(profileId: string, token: string, credentialsSaved: boolean): Promise<boolean> {
    const { result } = await this.graphQLService.sdk.saveAiProfileCredentials({
      profileId,
      credentials: { properties: { token } },
    });
    if (result) {
      this.setCredentialsSaved(profileId, credentialsSaved);
    }
    return result;
  }
}
