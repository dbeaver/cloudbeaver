/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable, runInAction } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { SyncExecutor, ISyncExecutor } from '@cloudbeaver/core-executor';
import { SessionResource } from '@cloudbeaver/core-root';
import { CachedDataResource, GetActiveUserQueryVariables, GraphQLService, isResourceKeyList, ObjectOrigin, ResourceKey, UserAuthToken, UserInfo } from '@cloudbeaver/core-sdk';

import { AUTH_PROVIDER_LOCAL_ID } from './AUTH_PROVIDER_LOCAL_ID';
import { AuthProviderService } from './AuthProviderService';
import type { IAuthCredentials } from './IAuthCredentials';

export type UserInfoIncludes = GetActiveUserQueryVariables;

@injectable()
export class UserInfoResource extends CachedDataResource<
UserInfo | null,
void,
void,
UserInfoIncludes
> {
  readonly userChange: ISyncExecutor<string>;

  get parametersAvailable() {
    return this.data !== null;
  }

  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly authProviderService: AuthProviderService,
    private readonly sessionResource: SessionResource
  ) {
    super(null, ['customIncludeOriginDetails', 'includeConfigurationParameters']);

    this.userChange = new SyncExecutor();

    this.sync(sessionResource, () => {}, () => {});

    makeObservable(this, {
      parametersAvailable: computed,
    });
  }

  isLinked(provideId: string): boolean {
    return this.data?.linkedAuthProviders.includes(provideId) || false;
  }

  getId(): string {
    return this.data?.userId || 'anonymous';
  }

  hasOrigin(origin: ObjectOrigin): boolean {
    if (!this.data) {
      return false;
    }

    return this.hasToken(origin.type, origin.subType);
  }

  hasToken(type: string, subType?: string): boolean {
    if (type === AUTH_PROVIDER_LOCAL_ID) {
      return true;
    }

    if (!this.data) {
      return false;
    }

    // TODO: will be changed due wrong origin in authTokens
    return (
      this.data.authTokens.some(token => token.origin.type === (subType ?? type))
      || this.data.authTokens.some(token => token.origin.type === type && token.origin.subType === subType)
    );
  }

  async login(provider: string, credentials: IAuthCredentials, link?: boolean): Promise<UserInfo | null> {
    await this.performUpdate(undefined, [], async () => {
      const processedCredentials = await this.authProviderService.processCredentials(provider, credentials);

      const { authToken } = await this.graphQLService.sdk.authLogin({
        provider,
        credentials: processedCredentials.credentials,
        linkUser: link,
        customIncludeOriginDetails: true,
      });

      this.resetIncludes();
      if (this.data === null || link) {
        this.setData(await this.loader());
      } else {
        this.data.authTokens.push(authToken as UserAuthToken);
      }
    });
    this.sessionResource.markOutdated();

    return this.data;
  }

  async logout(): Promise<void> {
    await this.performUpdate(undefined, [], async () => {
      if (this.data) {
        await this.graphQLService.sdk.authLogout();
        this.setData(null);
        this.resetIncludes();
      }
    });
    this.sessionResource.markOutdated();
  }

  async setConfigurationParameter(key: string, value: any): Promise<UserInfo | null> {
    await this.graphQLService.sdk.setUserConfigurationParameter({
      name: key,
      value,
    });

    if (this.data) {
      this.data.configurationParameters[key] = value;
    }

    return this.data;
  }

  async deleteConfigurationParameter(key: ResourceKey<string>): Promise<UserInfo | null> {
    if (isResourceKeyList(key)) {
      const keyList: string[] = [];
      for (const item of key.list) {
        await this.graphQLService.sdk.setUserConfigurationParameter({
          name: item,
          value: null,
        });

        keyList.push(item);
      }

      runInAction(() => {
        for (const item of keyList) {
          delete this.data?.configurationParameters[item];
        }
      });
    } else {
      await this.graphQLService.sdk.setUserConfigurationParameter({
        name: key,
        value: null,
      });

      delete this.data?.configurationParameters[key];
    }

    return this.data;
  }

  getConfigurationParameter(key: string): any {
    return this.data?.configurationParameters[key];
  }

  protected async loader(key: void, includes?: string[]): Promise<UserInfo | null> {
    const { user } = await this.graphQLService.sdk.getActiveUser({
      ...this.getDefaultIncludes(),
      ...this.getIncludesMap(key, includes),
    });

    return (user as UserInfo | null) ?? null;
  }

  protected setData(data: UserInfo | null): void {
    const prevUserId = this.getId();
    this.data = data;
    const currentUserId = this.getId();

    if (prevUserId !== currentUserId) {
      this.userChange.execute(currentUserId);
    }
  }

  private getDefaultIncludes(): UserInfoIncludes {
    return {
      customIncludeOriginDetails: true,
      includeConfigurationParameters: false,
      includeMetaParameters: false,
    };
  }

  protected resetIncludes(): void {
    const metadata = this.getMetadata();
    metadata.includes = [...this.defaultIncludes];
  }

  getIncludes(key: void): string[] {
    key = this.transformParam(key);
    const metadata = this.getMetadata(key);
    return metadata.includes;
  }
}
