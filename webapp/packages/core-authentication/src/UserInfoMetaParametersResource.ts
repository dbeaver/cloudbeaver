/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { CachedDataResource, ResourceKey } from '@cloudbeaver/core-resource';
import { GraphQLService } from '@cloudbeaver/core-sdk';

import { UserInfoResource } from './UserInfoResource';
import type { UserMetaParameter } from './UserMetaParametersResource';

@injectable()
export class UserInfoMetaParametersResource extends CachedDataResource<UserMetaParameter | null> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly userInfoResource: UserInfoResource,
  ) {
    super(() => null, undefined);

    this.sync(this.userInfoResource);
  }

  protected async loader(param: ResourceKey<void>): Promise<UserMetaParameter | null> {
    try {
      const { user } = await this.graphQLService.sdk.getActiveUserMetaParameters();

      return user?.metaParameters;
    } catch (exception: any) {
      return null;
    }
  }
}
