/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import {
  GraphQLService,
  CachedMapResource,
  ResourceKey,
  resourceKeyList,
  ResourceKeyList,
  ResourceKeyUtils,
  AdminTeamInfoFragment,
  AdminConnectionGrantInfo,
  CachedMapAllKey
} from '@cloudbeaver/core-sdk';
import { isArraysEqual } from '@cloudbeaver/core-utils';

const NEW_TEAM_SYMBOL = Symbol('new-team');

export type TeamInfo = AdminTeamInfoFragment;
type NewTeam = TeamInfo & { [NEW_TEAM_SYMBOL]: boolean; timestamp: number };

@injectable()
export class TeamsResource extends CachedMapResource<string, TeamInfo> {
  constructor(private readonly graphQLService: GraphQLService) {
    super();
  }

  async loadAll(): Promise<Map<string, TeamInfo>> {
    await this.load(CachedMapAllKey);
    return this.data;
  }

  async refreshAll(): Promise<Map<string, TeamInfo>> {
    await this.refresh(CachedMapAllKey);
    return this.data;
  }

  async createTeam(teamInfo: TeamInfo): Promise<TeamInfo> {
    const response = await this.graphQLService.sdk.createTeam(teamInfo);

    const newTeam: NewTeam = {
      ...response.team,
      [NEW_TEAM_SYMBOL]: true,
      timestamp: Date.now(),
    };

    this.updateTeams(newTeam);

    await this.setSubjectPermissions(newTeam.teamId, teamInfo.teamPermissions);

    return this.get(teamInfo.teamId)!;
  }

  async updateTeam(teamInfo: TeamInfo): Promise<TeamInfo> {
    const { team } = await this.graphQLService.sdk.updateTeam(teamInfo);

    this.updateTeams(team);

    await this.setSubjectPermissions(team.teamId, teamInfo.teamPermissions);

    return this.get(teamInfo.teamId)!;
  }

  async deleteTeam(key: ResourceKey<string>): Promise<Map<string, TeamInfo>> {
    await ResourceKeyUtils.forEachAsync(key, async key => {
      await this.graphQLService.sdk.deleteTeam({
        teamId: key,
      });
      this.delete(key);
    });

    return this.data;
  }

  async loadGrantedUsers(teamId: string): Promise<string[]> {
    const { team } = await this.graphQLService.sdk.getTeamGrantedUsers({ teamId });
    return team[0].grantedUsers;
  }

  async getSubjectConnectionAccess(subjectId: string): Promise<AdminConnectionGrantInfo[]> {
    const { grantInfo } = await this.graphQLService.sdk.getSubjectConnectionAccess({ subjectId });
    return grantInfo;
  }

  async setSubjectPermissions(teamId: string, permissions: string[]): Promise<void> {
    const team = this.get(teamId);

    if (team && isArraysEqual(team.teamPermissions, permissions)) {
      return;
    }

    const {
      permissions: newPermissions,
    } = await this.graphQLService.sdk.setSubjectPermissions({ teamId, permissions });

    if (team) {
      team.teamPermissions = newPermissions.map(permission => permission.id);
    } else {
      // TODO: update permissions for team instead
      await this.loader(teamId);
    }
  }

  protected async loader(key: ResourceKey<string>): Promise<Map<string, TeamInfo>> {
    const all = ResourceKeyUtils.includes(key, CachedMapAllKey);

    await ResourceKeyUtils.forEachAsync(all ? CachedMapAllKey : key, async key => {
      const teamId = all ? undefined : key;

      const { teams } = await this.graphQLService.sdk.getTeamsList({
        teamId,
      });

      if (all) {
        this.data.clear();
      }

      this.updateTeams(...teams);
    });

    return this.data;
  }

  cleanNewFlags(): void {
    for (const team of this.data.values()) {
      (team as NewTeam)[NEW_TEAM_SYMBOL] = false;
    }
  }

  private updateTeams(...teams: TeamInfo[]): ResourceKeyList<string> {
    const key = resourceKeyList(teams.map(team => team.teamId));

    const oldTeams = this.get(key);
    this.set(key, oldTeams.map((team, i) => ({ ...team, ...teams[i] })));

    return key;
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
