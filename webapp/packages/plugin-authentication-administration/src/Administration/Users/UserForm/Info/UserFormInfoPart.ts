/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable, toJS } from 'mobx';

import type { AdminUser, AuthRolesResource, UserMetaParameter, UsersMetaParametersResource, UsersResource } from '@cloudbeaver/core-authentication';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import type { ServerConfigResource } from '@cloudbeaver/core-root';
import { FormMode, FormPart, formValidationContext, type IFormState } from '@cloudbeaver/core-ui';
import { isArraysEqual, isObjectsEqual, isValuesEqual } from '@cloudbeaver/core-utils';
import { isDefined } from '@dbeaver/js-helpers';

import type { IUserFormState } from '../AdministrationUserFormService.js';
import type { IUserFormInfoState } from './IUserFormInfoState.js';

const DEFAULT_ENABLED = true;

export class UserFormInfoPart extends FormPart<IUserFormInfoState, IUserFormState> {
  constructor(
    private readonly authRolesResource: AuthRolesResource,
    private readonly serverConfigResource: ServerConfigResource,
    formState: IFormState<IUserFormState>,
    private readonly usersResource: UsersResource,
    private readonly usersMetaParametersResource: UsersMetaParametersResource,
  ) {
    super(formState, {
      userId: formState.state.userId || '',
      enabled: DEFAULT_ENABLED,
      password: '',
      metaParameters: {},
      teams: [],
      authRole: '',
    });

    this.disableUser = this.disableUser.bind(this);
  }

  protected override format(data: IFormState<IUserFormState>, contexts: IExecutionContextProvider<IFormState<IUserFormState>>): void | Promise<void> {
    this.state.password = this.state.password.trim();
    const metaParameters = this.state.metaParameters;

    if (this.formState.mode === FormMode.Create) {
      this.state.userId = this.state.userId.trim();
    }

    for (const key in metaParameters) {
      const value = metaParameters[key];

      if (typeof value === 'string') {
        metaParameters[key] = value.trim();
      }
    }
  }

  override isOutdated(): boolean {
    if (this.formState.mode === FormMode.Edit && this.initialState.userId) {
      return this.usersResource.isOutdated(this.initialState.userId) || this.usersMetaParametersResource.isOutdated(this.initialState.userId);
    }

    return this.serverConfigResource.isOutdated() || this.authRolesResource.isOutdated();
  }

  override isLoaded(): boolean {
    if (
      this.formState.mode === FormMode.Edit &&
      this.initialState.userId &&
      !this.usersResource.isLoaded(this.initialState.userId) &&
      !this.usersMetaParametersResource.isLoaded(this.initialState.userId)
    ) {
      return false;
    }

    return this.loaded;
  }

  async disableUser() {
    await this.usersResource.enableUser(this.state.userId, false, true);
    this.state.enabled = false;
    this.initialState.enabled = false;
  }

  override get isChanged(): boolean {
    if (!this.loaded) {
      return false;
    }

    return (
      !isValuesEqual(this.state.userId, this.initialState.userId, null) ||
      !isValuesEqual(this.state.enabled, this.initialState.enabled, null) ||
      !isValuesEqual(this.state.password, this.initialState.password, null) ||
      !isObjectsEqual(this.state.metaParameters, this.initialState.metaParameters) ||
      !isArraysEqual(this.state.teams, this.initialState.teams) ||
      !isValuesEqual(this.state.authRole, this.initialState.authRole, '')
    );
  }

  protected override async saveChanges(): Promise<void> {
    if (this.formState.mode === FormMode.Create) {
      const user = await this.usersResource.create({
        userId: this.state.userId,
        authRole: getTransformedAuthRole(this.state.authRole),
        enabled: this.state.enabled,
      });
      // userId is modified by backend and may not match value we sent, so we need to update the state
      this.state.userId = user.userId;
      this.initialState.userId = user.userId;
      this.formState.setMode(FormMode.Edit);
    }

    // load actual data of user to prevent conflicts
    await this.usersResource.refresh(this.state.userId);

    await this.updateCredentials();
    await this.updateTeams();
    await this.updateAuthRole(); // we must update role before enabling user to prevent situation when user current role will reach the limit
    if (this.formState.mode === FormMode.Edit) {
      await this.updateStatus();
    }
    await this.updateMetaParameters();

    this.usersResource.markOutdated(this.state.userId);
  }

  protected override validate(data: IFormState<IUserFormState>, contexts: IExecutionContextProvider<IFormState<IUserFormState>>) {
    if (!this.loaded) {
      return;
    }

    const validation = contexts.getContext(formValidationContext);

    if (data.mode === FormMode.Create) {
      if (!this.state.userId) {
        validation.error('authentication_user_login_not_set');
      }

      if (!this.state.password) {
        validation.error('authentication_user_password_not_set');
      }
    }

    if (this.authRolesResource.data.length > 0) {
      const authRole = getTransformedAuthRole(this.state.authRole);
      if (!authRole || !this.authRolesResource.data.includes(authRole)) {
        validation.error('authentication_user_role_not_set');
      }
    }
  }

  private async updateCredentials() {
    const password = this.state.password;

    if (password) {
      await this.usersResource.updateCredentials(this.state.userId, {
        profile: '0',
        credentials: { password },
      });
    }
  }

  private async updateAuthRole() {
    if (this.state.userId && this.authRolesResource.data.length > 0) {
      const authRole = getTransformedAuthRole(this.state.authRole);
      const user = this.usersResource.get(this.state.userId);

      if (!isValuesEqual(authRole, user?.authRole, '')) {
        await this.usersResource.setAuthRole(this.state.userId, authRole, true);
      }
    }
  }

  private async updateTeams() {
    let grantedTeams: string[] = [];

    if (this.state.userId) {
      grantedTeams = toJS(this.usersResource.get(this.state.userId)?.grantedTeams ?? []);
    }

    if (isArraysEqual(this.state.teams, grantedTeams)) {
      return;
    }

    const revokeTeams = grantedTeams.filter(teamId => !this.state.teams.includes(teamId)) ?? [];
    const grantTeams = this.state.teams.filter(teamId => !grantedTeams.includes(teamId));

    for (const teamId of revokeTeams) {
      await this.usersResource.revokeTeam(this.state.userId, teamId, true);
    }

    for (const teamId of grantTeams) {
      await this.usersResource.grantTeam(this.state.userId, teamId, true);
    }
  }

  private async updateStatus() {
    let enabled = false;

    if (this.state.userId) {
      enabled = this.usersResource.get(this.state.userId)?.enabled ?? false;
    }

    if (this.state.enabled !== enabled) {
      await this.usersResource.enableUser(this.state.userId, this.state.enabled, true);
    }
  }

  private async updateMetaParameters() {
    const metaParameters = toJS(this.state.metaParameters);

    if (this.state.userId) {
      const userMetaParameters = this.usersMetaParametersResource.get(this.state.userId);

      if (userMetaParameters && isObjectsEqual(userMetaParameters, metaParameters)) {
        return;
      }
    }

    await this.usersMetaParametersResource.setMetaParameters(this.state.userId, metaParameters);
  }

  protected override async loader() {
    let user: AdminUser | null = null;
    let metaParameters: UserMetaParameter | object = {};
    const [serverConfig] = await Promise.all([this.serverConfigResource.load(), this.authRolesResource.load()]);

    if (this.formState.mode === FormMode.Edit && this.initialState.userId) {
      [user, metaParameters] = await Promise.all([
        this.usersResource.load(this.initialState.userId),
        this.usersMetaParametersResource.load(this.initialState.userId),
      ]);
    }

    this.setInitialState({
      userId: user?.userId || this.formState.state.userId || '',
      enabled: user?.enabled ?? DEFAULT_ENABLED,
      metaParameters: observable(metaParameters),
      teams: observable(user?.grantedTeams || [serverConfig?.defaultUserTeam].filter(isDefined)),
      password: '',

      authRole: user?.authRole ?? serverConfig?.defaultAuthRole ?? '',
    });
  }
}

function getTransformedAuthRole(authRole: string): string {
  return authRole.trim();
}
