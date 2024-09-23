/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { CachedDataResource, type ResourceKey } from '@cloudbeaver/core-resource';
import { GraphQLService } from '@cloudbeaver/core-sdk';

import { UserInfoResource } from './UserInfoResource.js';
import type { UserMetaParameter } from './UserMetaParametersResource.js';

@injectable()
export class UserInfoMetaParametersResource extends CachedDataResource<UserMetaParameter | undefined> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly userInfoResource: UserInfoResource,
  ) {
    super(() => undefined, undefined);

    this.sync(this.userInfoResource);
  }

  protected async loader(param: ResourceKey<void>): Promise<UserMetaParameter | undefined> {
    const { user } = await this.graphQLService.sdk.getActiveUserMetaParameters();

    return user?.metaParameters;
  }
}
