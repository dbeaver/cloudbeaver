/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import React from 'react';

import { TeamsResource, UsersResource } from '@cloudbeaver/core-authentication';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { isArraysEqual, MetadataValueGetter } from '@cloudbeaver/core-utils';

import { teamContext } from '../Contexts/teamContext';
import type { ITeamFormProps, ITeamFormSubmitData } from '../ITeamFormProps';
import { TeamFormService } from '../TeamFormService';
import type { IGrantedUsersTabState } from './IGrantedUsersTabState';

const GrantedUsers = React.lazy(async () => {
  const { GrantedUsers } = await import('./GrantedUsers');
  return { default: GrantedUsers };
});

@injectable()
export class GrantedUsersTabService extends Bootstrap {
  private readonly key: string;

  constructor(
    private readonly teamFormService: TeamFormService,
    private readonly usersResource: UsersResource,
    private readonly teamsResource: TeamsResource,
    private readonly notificationService: NotificationService
  ) {
    super();
    this.key = 'granted-users';
  }

  register(): void {
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

  load(): void { }

  private stateGetter(context: ITeamFormProps): MetadataValueGetter<string, IGrantedUsersTabState> {
    return () => ({
      loading: false,
      loaded: false,
      editing: false,
      grantedUsers: [],
      initialGrantedUsers: [],
    });
  }

  private async save(
    data: ITeamFormSubmitData,
    contexts: IExecutionContextProvider<ITeamFormSubmitData>
  ) {
    const config = contexts.getContext(teamContext);
    const status = contexts.getContext(this.teamFormService.configurationStatusContext);

    if (!status.saved) {
      return;
    }

    const state = this.teamFormService.tabsContainer.getTabState<IGrantedUsersTabState>(
      data.state.partsState,
      this.key,
      { state: data.state }
    );

    if (!config.teamId || !state.loaded) {
      return;
    }

    const initial = await this.teamsResource.loadGrantedUsers(config.teamId);

    const changed = !isArraysEqual(initial, state.grantedUsers);

    if (!changed) {
      return;
    }

    const granted: string[] = [];
    const revoked: string[] = [];

    const revokedUsers = initial.filter(user => !state.grantedUsers.includes(user));

    try {
      for (const user of revokedUsers) {
        await this.usersResource.revokeTeam(user, config.teamId);
        revoked.push(user);
      }

      for (const user of state.grantedUsers) {
        if (!initial.includes(user)) {
          await this.usersResource.grantTeam(user, config.teamId);
          granted.push(user);
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
