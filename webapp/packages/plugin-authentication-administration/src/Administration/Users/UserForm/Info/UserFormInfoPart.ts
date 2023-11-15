/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';

import type { AdminUser, AuthRolesResource, UserResourceIncludes, UsersResource } from '@cloudbeaver/core-authentication';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { CachedResourceIncludeArgs, getCachedDataResourceLoaderState } from '@cloudbeaver/core-resource';
import type { ServerConfigResource } from '@cloudbeaver/core-root';
import type { AdminUserInfoFragment } from '@cloudbeaver/core-sdk';
import { FormMode, FormPart, formValidationContext, IFormState } from '@cloudbeaver/core-ui';
import { isArraysEqual, isDefined, isObjectsEqual, isValuesEqual } from '@cloudbeaver/core-utils';
import { DATA_CONTEXT_LOADABLE_STATE } from '@cloudbeaver/core-view';

import type { IUserFormState } from '../AdministrationUserFormService';
import type { AdministrationUserFormState } from '../AdministrationUserFormState';
import type { IUserFormInfoState } from './IUserFormInfoState';

const DEFAULT_ENABLED = true;

export class UserFormInfoPart extends FormPart<IUserFormInfoState, IUserFormState> {
  private baseIncludes: CachedResourceIncludeArgs<AdminUserInfoFragment, UserResourceIncludes>;
  constructor(
    private readonly authRolesResource: AuthRolesResource,
    private readonly serverConfigResource: ServerConfigResource,
    formState: AdministrationUserFormState,
    private readonly usersResource: UsersResource,
  ) {
    super(formState, {
      userId: formState.state.userId || '',
      enabled: DEFAULT_ENABLED,
      password: '',
      metaParameters: {},
      teams: [],
      authRole: '',
    });
    this.baseIncludes = ['includeMetaParameters'];
  }

  isOutdated(): boolean {
    if (this.formState.mode === FormMode.Edit && this.initialState.userId) {
      return this.usersResource.isOutdated(this.initialState.userId, this.baseIncludes);
    }

    return false;
  }

  isLoaded(): boolean {
    if (
      this.formState.mode === FormMode.Edit &&
      this.initialState.userId &&
      !this.usersResource.isLoaded(this.initialState.userId, this.baseIncludes)
    ) {
      return false;
    }

    return this.loaded;
  }

  isChanged(): boolean {
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
      });
      this.initialState.userId = user.userId;
      this.formState.setMode(FormMode.Edit);
    }

    // load actual data of user to prevent conflicts
    await this.usersResource.refresh(this.state.userId);

    await this.updateCredentials();
    await this.updateTeams();
    await this.updateAuthRole(); // we must update role before enabling user to prevent situation when user current role will reach the limit
    await this.updateStatus();
    await this.updateMetaParameters();

    this.usersResource.markOutdated(this.state.userId);
  }

  protected override validate(data: IFormState<IUserFormState>, contexts: IExecutionContextProvider<IFormState<IUserFormState>>) {
    if (!this.loaded) {
      return;
    }

    const validation = contexts.getContext(formValidationContext);

    if (data.mode === FormMode.Create) {
      if (!this.state.userId.trim()) {
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
  protected override configure() {
    const loadableStateContext = this.formState.dataContext.get(DATA_CONTEXT_LOADABLE_STATE);

    loadableStateContext.getState('user-info', () => [
      getCachedDataResourceLoaderState(this.serverConfigResource, undefined),
      getCachedDataResourceLoaderState(this.authRolesResource, undefined),
    ]);
  }

  private async updateCredentials() {
    if (this.state.password) {
      await this.usersResource.updateCredentials(this.state.userId, {
        profile: '0',
        credentials: { password: this.state.password },
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
      grantedTeams = this.usersResource.get(this.state.userId)?.grantedTeams ?? [];
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
    if (this.state.userId) {
      const user = this.usersResource.get(this.state.userId);

      if (user && isObjectsEqual(user.metaParameters, this.state.metaParameters)) {
        return;
      }
    }

    await this.usersResource.setMetaParameters(this.state.userId, this.state.metaParameters);
  }

  protected override async loader() {
    let user: AdminUser | null = null;
    const serverConfig = await this.serverConfigResource.load();

    if (this.formState.mode === FormMode.Edit && this.initialState.userId) {
      user = await this.usersResource.load(this.initialState.userId, this.baseIncludes);
    }

    this.setInitialState({
      userId: user?.userId || this.formState.state.userId || '',
      enabled: user?.enabled ?? DEFAULT_ENABLED,
      metaParameters: observable(user?.metaParameters || {}),
      teams: observable(user?.grantedTeams || [serverConfig?.defaultUserTeam].filter(isDefined)),
      password: '',

      authRole: user?.authRole ?? serverConfig?.defaultAuthRole ?? '',
    });
  }
}

function getTransformedAuthRole(authRole: string): string {
  return authRole.trim();
}
