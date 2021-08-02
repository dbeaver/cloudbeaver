/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { SessionDataResource, SessionResource } from '@cloudbeaver/core-root';
import { CachedDataResource, GraphQLService, ObjectOrigin, UserAuthToken, UserInfo } from '@cloudbeaver/core-sdk';

import { AUTH_PROVIDER_LOCAL_ID } from './AUTH_PROVIDER_LOCAL_ID';
import { AuthProviderService } from './AuthProviderService';

@injectable()
export class UserInfoResource extends CachedDataResource<UserInfo | null, void> {
  constructor(
    private graphQLService: GraphQLService,
    private authProviderService: AuthProviderService,
    private sessionResource: SessionResource,
    private sessionDataResource: SessionDataResource
  ) {
    super(null);

    this.sync(this.sessionResource);
    this.sessionDataResource.beforeLoad.addHandler(() => this.load());
    this.onDataOutdated.addHandler(() => this.sessionDataResource.markOutdated());
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
    return this.data.authTokens.some(token => token.origin.type === (subType ?? type))
    || this.data.authTokens.some(token => token.origin.type === type && token.origin.subType === subType);
  }

  async login(provider: string, credentials: Record<string, string>, link?: boolean): Promise<UserInfo | null> {
    await this.performUpdate(undefined, undefined, async () => {
      const processedCredentials = await this.authProviderService.processCredentials(provider, credentials);

      const { authToken } = await this.graphQLService.sdk.authLogin({
        provider,
        credentials: processedCredentials,
        linkUser: link,
        customIncludeOriginDetails: true,
      });
      if (this.data === null || link) {
        this.data = await this.loader();
      } else {
        this.data.authTokens.push(authToken as UserAuthToken);
      }
    });
    await this.sessionDataResource.refresh();

    return this.data;
  }

  async logout(): Promise<void> {
    await this.performUpdate(undefined, undefined, async () => {
      if (this.data) {
        await this.graphQLService.sdk.authLogout();
        this.data = null;
      }
    });
    await this.sessionDataResource.refresh();
  }

  protected async loader(): Promise<UserInfo | null> {
    const { user } = await this.graphQLService.sdk.getActiveUser({
      customIncludeOriginDetails: true,
    });

    return (user as UserInfo | null) ?? null;
  }
}
