/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { TeamRolesResource, TeamsResource, UsersResource } from '@cloudbeaver/core-authentication';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { FormPart, formStatusContext, type IFormState } from '@cloudbeaver/core-ui';

import type { ITeamFormState } from '../TeamsAdministrationFormService.js';
import type { IGrantedUsersState } from './IGrantedUsersState.js';

function getInitialState(): IGrantedUsersState {
  return {
    grantedUsers: [],
  };
}

export class GrantedUsersFormPart extends FormPart<IGrantedUsersState, ITeamFormState> {
  constructor(
    formState: IFormState<ITeamFormState>,
    private readonly teamsResource: TeamsResource,
    private readonly usersResource: UsersResource,
    private readonly teamRolesResource: TeamRolesResource,
  ) {
    super(formState, getInitialState());

    this.grant = this.grant.bind(this);
    this.revoke = this.revoke.bind(this);
    this.assignTeamRole = this.assignTeamRole.bind(this);
  }

  protected override async loader(): Promise<void> {
    if (this.formState.mode === 'edit' && this.formState.state.teamId) {
      const grantedUsers = await this.teamsResource.loadGrantedUsers(this.formState.state.teamId);

      this.setInitialState({
        ...getInitialState(),
        grantedUsers,
      });

      return;
    }

    this.setInitialState(getInitialState());
  }

  protected override async saveChanges(
    data: IFormState<ITeamFormState>,
    contexts: IExecutionContextProvider<IFormState<ITeamFormState>>,
  ): Promise<void> {
    const status = contexts.getContext(formStatusContext);

    if (!this.formState.state.teamId) {
      return;
    }

    const granted: string[] = [];
    const revoked: string[] = [];

    const revokedUsers = this.initialState.grantedUsers.filter(
      user => !this.state.grantedUsers.some(grantedUser => grantedUser.userId === user.userId),
    );

    for (const user of revokedUsers) {
      await this.usersResource.revokeTeam(user.userId, this.formState.state.teamId);
      revoked.push(user.userId);
    }

    for (const user of this.state.grantedUsers) {
      const initialUser = this.initialState.grantedUsers.find(grantedUser => grantedUser.userId === user.userId);

      if (!initialUser) {
        await this.usersResource.grantTeam(user.userId, this.formState.state.teamId);
        granted.push(user.userId);
      }

      const initialRole = initialUser?.teamRole ?? null;

      if (user.teamRole !== initialRole) {
        await this.teamRolesResource.assignTeamRoleToUser(user.userId, this.formState.state.teamId, user.teamRole);
      }
    }

    if (granted.length) {
      status.info(`Added users: "${granted.join(', ')}"`);
    }

    if (revoked.length) {
      status.info(`Deleted users: "${revoked.join(', ')}"`);
    }
  }

  revoke(subjectIds: string[]) {
    this.state.grantedUsers = this.state.grantedUsers.filter(subject => !subjectIds.includes(subject.userId));
  }

  grant(subjectIds: string[]) {
    this.state.grantedUsers.push(...subjectIds.map(id => ({ userId: id, teamRole: null })));
  }

  assignTeamRole(subjectId: string, teamRole: string | null) {
    const user = this.state.grantedUsers.find(user => user.userId === subjectId);

    if (user) {
      user.teamRole = teamRole;
    }
  }
}
