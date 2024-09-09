/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { CachedMapAllKey, CachedMapResource, isResourceAlias, ResourceKey, resourceKeyList, ResourceKeyUtils } from '@cloudbeaver/core-resource';
import { GraphQLService } from '@cloudbeaver/core-sdk';

import { TeamMetaParameter } from './TeamMetaParametersResource';
import { TeamsResource } from './TeamsResource';

@injectable()
export class TeamInfoMetaParametersResource extends CachedMapResource<string, TeamMetaParameter> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly teamsResource: TeamsResource,
  ) {
    super();

    this.sync(this.teamsResource);
  }

  protected async loader(param: ResourceKey<string>): Promise<Map<string, TeamMetaParameter>> {
    const all = this.aliases.isAlias(param, CachedMapAllKey);
    const teamsList: [string, TeamMetaParameter][] = [];

    await ResourceKeyUtils.forEachAsync(param, async key => {
      let teamId: string | undefined;

      if (!isResourceAlias(key)) {
        teamId = key;
      }

      const { teams } = await this.graphQLService.sdk.getTeamsListMetaParameters({
        teamId,
      });
      const metaParameters = teams[0].metaParameters;

      if (teamId) {
        teamsList.push([teamId, metaParameters]);
      }
    });

    const key = resourceKeyList(teamsList.map(([teamId]) => teamId));
    const value = teamsList.map(([_, metaParameters]) => metaParameters);

    if (all) {
      this.replace(key, value);
    } else {
      this.set(key, value);
    }

    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}
