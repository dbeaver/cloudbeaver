/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { SessionResource } from '@cloudbeaver/core-root';
import { CachedDataResource, GraphQLService, UserInfo } from '@cloudbeaver/core-sdk';

import { AuthProviderService } from './AuthProviderService';

@injectable()
export class UserInfoResource extends CachedDataResource<UserInfo | null, void> {
  constructor(
    private graphQLService: GraphQLService,
    private authProviderService: AuthProviderService,
    private sessionResource: SessionResource
  ) {
    super(null);

    this.sessionResource.onDataOutdated.addHandler(() => this.markOutdated());
    this.sessionResource.onDataUpdate.addHandler(async () => { await this.load(); });
  }

  getId(): string {
    return this.data?.userId || 'anonymous';
  }

  hasToken(type: string, subType?: string): boolean {
    if (!this.data) {
      return false;
    }

    // TODO: will be changed due wrong origin in authTokens
    return this.data.authTokens.some(token => token.origin.type === (subType ?? type))
    || this.data.authTokens.some(token => token.origin.type === type && token.origin.subType === subType);
  }

  async login(provider: string, credentials: Record<string, string>): Promise<UserInfo | null> {
    const processedCredentials = await this.authProviderService.processCredentials(provider, credentials);

    // TODO: will be replaced with another function
    const { user } = await this.graphQLService.sdk.authLogin({
      provider,
      credentials: processedCredentials,
    });

    await this.refresh();
    await this.updateSession();

    return this.data;
  }

  async logout(): Promise<void> {
    if (this.data) {
      await this.graphQLService.sdk.authLogout();
      this.data = null;
      await this.updateSession();
    }
  }

  protected async loader(): Promise<UserInfo | null> {
    await this.sessionResource.load();
    const { user } = await this.graphQLService.sdk.getActiveUser({
      customIncludeOriginDetails: true,
    });

    return (user as UserInfo | null) ?? null;
  }

  private async updateSession() {
    await this.sessionResource.refresh();
  }
}
