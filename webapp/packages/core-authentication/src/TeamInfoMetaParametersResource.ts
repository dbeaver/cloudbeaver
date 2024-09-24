/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { CachedMapAllKey, CachedMapResource, isResourceAlias, type ResourceKey, resourceKeyList, ResourceKeyUtils } from '@cloudbeaver/core-resource';
import { GraphQLService } from '@cloudbeaver/core-sdk';

import type { TeamMetaParameter } from './TeamMetaParametersResource.js';
import { TeamsResource } from './TeamsResource.js';

@injectable()
export class TeamInfoMetaParametersResource extends CachedMapResource<string, TeamMetaParameter> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly teamsResource: TeamsResource,
  ) {
    super();

    this.sync(this.teamsResource);
    this.teamsResource.onItemDelete.addHandler(this.delete.bind(this));
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

      if (!teams.length) {
        throw new Error(`Team ${teamId} not found`);
      }

      const metaParameters = teams[0]?.metaParameters;

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

  async setMetaParameters(teamId: string, parameters: Record<string, any>): Promise<void> {
    await this.performUpdate(teamId, [], async () => {
      await this.graphQLService.sdk.saveTeamMetaParameters({ teamId, parameters });

      if (this.data) {
        this.data.set(teamId, parameters as TeamMetaParameter);
      }
    });
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}
