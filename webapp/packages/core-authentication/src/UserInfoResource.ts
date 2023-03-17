/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable, runInAction } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { SyncExecutor, ISyncExecutor, ITask, AutoRunningTask, whileTask } from '@cloudbeaver/core-executor';
import { SessionResource } from '@cloudbeaver/core-root';
import { AuthInfo, AuthStatus, CachedDataResource, GetActiveUserQueryVariables, GraphQLService, ResourceKeySimple, ResourceKeyUtils, UserAuthToken, UserInfo } from '@cloudbeaver/core-sdk';

import { AUTH_PROVIDER_LOCAL_ID } from './AUTH_PROVIDER_LOCAL_ID';
import { AuthProviderService } from './AuthProviderService';
import type { ELMRole } from './ELMRole';
import type { IAuthCredentials } from './IAuthCredentials';

export type UserInfoIncludes = GetActiveUserQueryVariables;

export interface ILoginOptions {
  credentials?: IAuthCredentials;
  configurationId?: string;
  linkUser?: boolean;
}

@injectable()
export class UserInfoResource extends CachedDataResource<
UserInfo | null,
void,
UserInfoIncludes
> {
  readonly onUserChange: ISyncExecutor<string>;

  get authRole(): ELMRole | undefined {
    return this.data?.authRole as ELMRole | undefined;
  }

  get parametersAvailable() {
    return this.data !== null;
  }

  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly authProviderService: AuthProviderService,
    private readonly sessionResource: SessionResource
  ) {
    super(() => null, undefined, ['customIncludeOriginDetails', 'includeConfigurationParameters']);

    this.onUserChange = new SyncExecutor();

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

  hasToken(providerId: string): boolean {
    if (providerId === AUTH_PROVIDER_LOCAL_ID) {
      return true;
    }

    if (!this.data) {
      return false;
    }

    // TODO: will be changed due wrong origin in authTokens
    return (
      this.data.authTokens.some(token => token.authProvider === providerId)
    );
  }

  async login(
    provider: string,
    { credentials, configurationId, linkUser }: ILoginOptions
  ): Promise<AuthInfo> {
    let processedCredentials: Record<string, any> | undefined;

    if (credentials) {
      const processed = await this.authProviderService.processCredentials(provider, credentials);
      processedCredentials = processed.credentials;
    }

    const { authInfo } = await this.graphQLService.sdk.authLogin({
      provider,
      configuration: configurationId,
      credentials: processedCredentials,
      linkUser,
      customIncludeOriginDetails: true,
    });

    if (authInfo.userTokens && authInfo.authStatus === AuthStatus.Success) {
      if (this.data === null || linkUser) {
        this.resetIncludes();
        this.setData(await this.loader());
      } else {
        this.data.authTokens.push(...authInfo.userTokens as UserAuthToken[]);
      }

      this.sessionResource.markOutdated();
    }

    return authInfo as AuthInfo;
  }

  finishFederatedAuthentication(authId: string, linkUser?: boolean): ITask<UserInfo | null> {
    let activeTask: ITask<AuthInfo> | undefined;

    return new AutoRunningTask<UserInfo | null>(() => this.performUpdate(
      undefined,
      [],
      async () => {
        activeTask = whileTask<AuthInfo>(
          authInfo => {
            if (authInfo.authStatus === AuthStatus.Success) {
              return true;
            } else if (authInfo.authStatus === AuthStatus.Error) {
              throw new Error('Authentication error');
            }

            return false;
          },
          async () => {
            const { authInfo } = await this.graphQLService.sdk.getAuthStatus({
              authId,
              linkUser,
              customIncludeOriginDetails: true,
            });
            return authInfo as AuthInfo;
          },
          1000
        );

        const authInfo = await activeTask;

        if (authInfo.userTokens && authInfo.authStatus === AuthStatus.Success) {
          if (this.data === null) {
            this.resetIncludes();
            this.setData(await this.loader());
          } else {
            this.data.authTokens.push(...authInfo.userTokens as UserAuthToken[]);
          }

          this.sessionResource.markOutdated();
        }

        return this.data;
      }
    ), () => {
      activeTask?.cancel();
    });
  }

  async logout(provider?: string, configuration?: string): Promise<void> {
    await this.graphQLService.sdk.authLogout({
      provider,
      configuration,
    });

    if (!provider || (this.data?.authTokens.length || 0) <= 1) {
      this.setData(null);
      this.resetIncludes();
    }
    this.sessionResource.markOutdated();
  }

  async setConfigurationParameter(key: string, value: any): Promise<UserInfo | null> {
    if (!this.data) {
      return null;
    }

    await this.graphQLService.sdk.setUserConfigurationParameter({
      name: key,
      value,
    });

    this.data.configurationParameters[key] = value;

    return this.data;
  }

  async deleteConfigurationParameter(key: ResourceKeySimple<string>): Promise<UserInfo | null> {
    const keyList: string[] = [];
    await ResourceKeyUtils.forEachAsync(key, async name => {
      await this.graphQLService.sdk.setUserConfigurationParameter({
        name,
        value: null,
      });

      keyList.push(name);
    });

    runInAction(() => {
      for (const item of keyList) {
        delete this.data?.configurationParameters[item];
      }
    });

    return this.data;
  }

  getConfigurationParameter(key: string): any {
    return this.data?.configurationParameters[key];
  }

  protected async loader(
    key: void,
    includes?: ReadonlyArray<string>,
  ): Promise<UserInfo | null> {
    const { user } = await this.graphQLService.sdk.getActiveUser({
      ...this.getDefaultIncludes(),
      ...this.getIncludesMap(key, includes),
    });

    return (user as UserInfo | null) || null;
  }

  protected setData(data: UserInfo | null): void {
    const prevUserId = this.getId();
    this.data = data;
    const currentUserId = this.getId();

    if (prevUserId !== currentUserId) {
      this.onUserChange.execute(currentUserId);
    }
  }

  private getDefaultIncludes(): UserInfoIncludes {
    return {
      customIncludeOriginDetails: true,
      includeConfigurationParameters: false,
      includeMetaParameters: false,
    };
  }
}
