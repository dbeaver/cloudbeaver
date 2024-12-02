/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { SessionResource } from '@cloudbeaver/core-root';
import { GraphQLService, type ObjectPropertyInfo } from '@cloudbeaver/core-sdk';

export type TeamMetaParameter = ObjectPropertyInfo;

@injectable()
export class TeamMetaParametersResource extends CachedDataResource<TeamMetaParameter[]> {
  constructor(
    private readonly graphQLService: GraphQLService,
    sessionResource: SessionResource,
  ) {
    super(() => []);

    this.sync(
      sessionResource,
      () => {},
      () => {},
    );
  }

  protected async loader(): Promise<TeamMetaParameter[]> {
    const { parameters } = await this.graphQLService.sdk.getTeamMetaParameters();
    return parameters;
  }
}
