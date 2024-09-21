/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { TeamRolesResource, TeamsResource, UsersResource } from '@cloudbeaver/core-authentication';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { isArraysEqual, isObjectsEqual, type MetadataValueGetter } from '@cloudbeaver/core-utils';

import { teamContext } from '../Contexts/teamContext.js';
import type { ITeamFormProps, ITeamFormSubmitData } from '../ITeamFormProps.js';
import { TeamFormService } from '../TeamFormService.js';
import type { IGrantedUsersTabState } from './IGrantedUsersTabState.js';

const GrantedUsers = React.lazy(async () => {
  const { GrantedUsers } = await import('./GrantedUsers.js');
  return { default: GrantedUsers };
});

@injectable()
export class GrantedUsersTabService extends Bootstrap {
  private readonly key: string;

  constructor(
    private readonly teamFormService: TeamFormService,
    private readonly usersResource: UsersResource,
    private readonly teamsResource: TeamsResource,
    private readonly notificationService: NotificationService,
    private readonly teamRolesResource: TeamRolesResource,
  ) {
    super();
    this.key = 'granted-users';
  }

  override register(): void {
    this.teamFormService.tabsContainer.add({
      key: this.key,
      name: 'administration_teams_team_granted_users_tab_title',
      title: 'administration_teams_team_granted_users_tab_title',
      order: 2,
      stateGetter: context => this.stateGetter(context),
      panel: () => GrantedUsers,
    });

    this.teamFormService.afterFormSubmittingTask.addHandler(this.save.bind(this));
  }

  private stateGetter(context: ITeamFormProps): MetadataValueGetter<string, IGrantedUsersTabState> {
    return () => ({
      loading: false,
      loaded: false,
      editing: false,
      grantedUsers: [],
      initialGrantedUsers: [],
    });
  }

  private async save(data: ITeamFormSubmitData, contexts: IExecutionContextProvider<ITeamFormSubmitData>) {
    const config = contexts.getContext(teamContext);
    const status = contexts.getContext(this.teamFormService.configurationStatusContext);

    if (!status.saved) {
      return;
    }

    const state = this.teamFormService.tabsContainer.getTabState<IGrantedUsersTabState>(data.state.partsState, this.key, { state: data.state });

    if (!config.teamId || !state.loaded) {
      return;
    }

    const initial = await this.teamsResource.loadGrantedUsers(config.teamId);

    const changed = !isArraysEqual(initial, state.grantedUsers, isObjectsEqual);

    if (!changed) {
      return;
    }

    const granted: string[] = [];
    const revoked: string[] = [];

    const revokedUsers = initial.filter(user => !state.grantedUsers.some(grantedUser => grantedUser.userId === user.userId));

    try {
      for (const user of revokedUsers) {
        await this.usersResource.revokeTeam(user.userId, config.teamId);
        revoked.push(user.userId);
      }

      for (const user of state.grantedUsers) {
        const initialUser = initial.find(grantedUser => grantedUser.userId === user.userId);

        if (!initialUser) {
          await this.usersResource.grantTeam(user.userId, config.teamId);
          granted.push(user.userId);
        }

        const initialRole = initialUser?.teamRole ?? null;

        if (user.teamRole !== initialRole) {
          await this.teamRolesResource.assignTeamRoleToUser(user.userId, config.teamId, user.teamRole);
        }
      }

      state.loaded = false;
    } catch (exception: any) {
      this.notificationService.logException(exception);
    }

    if (granted.length) {
      status.info(`Added users: "${granted.join(', ')}"`);
    }

    if (revoked.length) {
      status.info(`Deleted users: "${revoked.join(', ')}"`);
    }
  }
}
