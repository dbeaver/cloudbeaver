/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { SessionResource } from '@cloudbeaver/core-root';
import { CachedDataResource, GraphQLService, UserConnectionAuthPropertiesFragment } from '@cloudbeaver/core-sdk';

export type UserMetaParameter = UserConnectionAuthPropertiesFragment;
export interface IUserMetaParameterOptions{
  id: string;
  displayName: string;
  description?: string;
  required: boolean;
}

@injectable()
export class UserMetaParametersResource extends CachedDataResource<UserMetaParameter[]> {
  constructor(
    private graphQLService: GraphQLService,
    sessionResource: SessionResource,
  ) {
    super([]);

    this.sync(sessionResource);
  }

  async add(options: IUserMetaParameterOptions): Promise<UserMetaParameter> {
    const { parameter } = await this.graphQLService.sdk.setUserMetaParameter(options);

    this.data.push(parameter);

    return parameter;
  }

  async delete(id: string): Promise<void> {
    await this.graphQLService.sdk.deleteUserMetaParameter({ id });

    const index = this.data.findIndex(property => property.id === id);

    if (index > -1) {
      this.data.splice(index, 1);
    }
  }

  protected async loader(): Promise<UserMetaParameter[]> {
    const { properties } = await this.graphQLService.sdk.getUserProfileProperties();

    return properties;
  }
}
