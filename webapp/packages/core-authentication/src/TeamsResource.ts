/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import {
  CachedMapAllKey,
  CachedMapResource,
  isResourceAlias,
  type ResourceKey,
  resourceKeyList,
  type ResourceKeySimple,
  ResourceKeyUtils,
} from '@cloudbeaver/core-resource';
import {
  type AdminConnectionGrantInfo,
  type AdminTeamInfoFragment,
  type AdminUserTeamGrantInfo,
  type GetTeamsListQueryVariables,
  GraphQLService,
} from '@cloudbeaver/core-sdk';
import { isArraysEqual, type UndefinedToNull } from '@cloudbeaver/core-utils';

const NEW_TEAM_SYMBOL = Symbol('new-team');

export type TeamInfo = AdminTeamInfoFragment;
export type UserTeamGrantInfo = UndefinedToNull<AdminUserTeamGrantInfo>;

type TeamResourceIncludes = Omit<GetTeamsListQueryVariables, 'teamId'>;
type NewTeam = TeamInfo & { [NEW_TEAM_SYMBOL]: boolean; timestamp: number };

@injectable()
export class TeamsResource extends CachedMapResource<string, TeamInfo, TeamResourceIncludes> {
  constructor(private readonly graphQLService: GraphQLService) {
    super();
  }

  async createTeam({ teamId, teamPermissions, teamName, description }: TeamInfo): Promise<TeamInfo> {
    const response = await this.graphQLService.sdk.createTeam({
      teamId,
      teamName,
      description,
      ...this.getIncludesMap(teamId),
    });

    const newTeam: NewTeam = {
      ...response.team,
      [NEW_TEAM_SYMBOL]: true,
      timestamp: Date.now(),
    };

    this.set(newTeam.teamId, newTeam);

    await this.setSubjectPermissions(newTeam.teamId, teamPermissions);

    return this.get(newTeam.teamId)!;
  }

  async updateTeam({ teamId, teamPermissions, teamName, description }: TeamInfo): Promise<TeamInfo> {
    const { team } = await this.graphQLService.sdk.updateTeam({
      teamId,
      teamName,
      description,
      ...this.getIncludesMap(teamId),
    });

    this.set(team.teamId, team);

    await this.setSubjectPermissions(team.teamId, teamPermissions);

    this.markOutdated(team.teamId);

    return this.get(team.teamId)!;
  }

  async deleteTeam(key: ResourceKeySimple<string>, options?: { force: boolean }): Promise<Map<string, TeamInfo>> {
    await ResourceKeyUtils.forEachAsync(key, async key => {
      await this.graphQLService.sdk.deleteTeam({
        teamId: key,
        force: options?.force ?? false,
      });
      this.delete(key);
    });

    return this.data;
  }

  async loadGrantedUsers(teamId: string): Promise<UserTeamGrantInfo[]> {
    const { team } = await this.graphQLService.sdk.getTeamGrantedUsers({ teamId });

    if (!team.length) {
      throw new Error('Team not found');
    }
    return team[0]!.grantedUsersInfo.map(user => ({ userId: user.userId, teamRole: user.teamRole ?? null }));
  }

  async getSubjectConnectionAccess(subjectId: string): Promise<AdminConnectionGrantInfo[]> {
    const { grantInfo } = await this.graphQLService.sdk.getSubjectConnectionAccess({ subjectId });
    return grantInfo;
  }

  async setSubjectPermissions(subjectId: string, permissions: string[]): Promise<void> {
    const team = this.get(subjectId);

    if (team && isArraysEqual(team.teamPermissions, permissions)) {
      return;
    }

    const { permissions: newPermissions } = await this.graphQLService.sdk.setSubjectPermissions({ subjectId, permissions });

    if (team) {
      team.teamPermissions = newPermissions.map(permission => permission.id);
    } else {
      // TODO: update permissions for team instead
      await this.loader(subjectId, []);
    }
  }

  protected async loader(originalKey: ResourceKey<string>, includes?: string[]): Promise<Map<string, TeamInfo>> {
    const all = this.aliases.isAlias(originalKey, CachedMapAllKey);
    const teamsList: TeamInfo[] = [];

    await ResourceKeyUtils.forEachAsync(originalKey, async key => {
      let teamId: string | undefined;

      if (!isResourceAlias(key)) {
        teamId = key;
      }

      const { teams } = await this.graphQLService.sdk.getTeamsList({
        teamId,
        ...this.getIncludesMap(teamId, includes),
      });

      teamsList.push(...teams);
    });

    const key = resourceKeyList(teamsList.map(team => team.teamId));
    if (all) {
      this.replace(key, teamsList);
    } else {
      this.set(key, teamsList);
    }

    return this.data;
  }

  cleanNewFlags(): void {
    for (const team of this.data.values()) {
      (team as NewTeam)[NEW_TEAM_SYMBOL] = false;
    }
  }

  protected override dataSet(key: string, value: AdminTeamInfoFragment): void {
    const oldTeam = this.dataGet(key);
    super.dataSet(key, { ...oldTeam, ...value });
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}

function isNewTeam(team: TeamInfo | NewTeam): team is NewTeam {
  return (team as NewTeam)[NEW_TEAM_SYMBOL];
}

export function compareTeams(a: TeamInfo, b: TeamInfo): number {
  if (isNewTeam(a) && isNewTeam(b)) {
    return b.timestamp - a.timestamp;
  }

  if (isNewTeam(b)) {
    return 1;
  }

  if (isNewTeam(a)) {
    return -1;
  }

  return a.teamId.localeCompare(b.teamId);
}
