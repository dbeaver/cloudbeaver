/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable, toJS } from 'mobx';

import type { AdminUser, UsersResource } from '@cloudbeaver/core-authentication';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import type { ServerConfig, ServerConfigResource } from '@cloudbeaver/core-root';
import { getCachedDataResourceLoaderState } from '@cloudbeaver/core-sdk';
import { FormMode, formValidationContext, IFormState } from '@cloudbeaver/core-ui';
import { isArraysEqual, isDefined, isObjectsEqual, isValuesEqual } from '@cloudbeaver/core-utils';
import { DATA_CONTEXT_LOADABLE_STATE } from '@cloudbeaver/core-view';

import type { IUserFormState } from '../AdministrationUserFormService';
import type { AdministrationUserFormState } from '../AdministrationUserFormState';
import type { IUserFormInfoPart } from './IUserFormInfoPart';

interface IUserFormInfoState {
  userId: string;
  enabled: boolean;
  password: string;
  metaParameters: Record<string, any>;
  teams: string[];
}

export class UserFormInfoPart implements IUserFormInfoPart {
  state: IUserFormInfoState;
  initialState: IUserFormInfoState;

  exception: Error | null;
  promise: Promise<any> | null;

  private loaded: boolean;
  private loading: boolean;

  constructor(
    private readonly serverConfigResource: ServerConfigResource,
    private readonly formState: AdministrationUserFormState,
    private readonly usersResource: UsersResource,
  ) {
    this.state = {
      userId: formState.state.userId || '',
      enabled: true,
      password: '',
      metaParameters: {},
      teams: [],
    };
    this.initialState = toJS(this.state);

    this.exception = null;
    this.promise = null;

    this.loaded = false;
    this.loading = false;

    this.formState.configureTask.addHandler(this.configure.bind(this));
    this.formState.submitTask.addHandler(this.save.bind(this));
    this.formState.validationTask.addHandler(this.validate.bind(this));

    makeObservable<this, 'loaded' | 'loading' | 'fillDefaultConfig'>(this, {
      state: observable,
      initialState: observable,
      promise: observable.ref,
      exception: observable.ref,
      loaded: observable,
      loading: observable,
      fillDefaultConfig: action,
    });
  }

  isLoading(): boolean {
    return this.loading;
  }

  isOutdated(): boolean {
    if (this.formState.mode === FormMode.Edit && this.initialState.userId) {
      return this.usersResource.isOutdated(this.initialState.userId);
    }

    return false;
  }

  isLoaded(): boolean {
    if (
      this.formState.mode === FormMode.Edit &&
      this.initialState.userId &&
      !this.usersResource.isLoaded(this.initialState.userId, ['includeMetaParameters'])
    ) {
      return false;
    }

    return this.loaded;
  }

  isError(): boolean {
    return this.exception !== null;
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
      !isArraysEqual(this.state.teams, this.initialState.teams)
    );
  }

  async load() {
    if (this.loading) {
      return this.promise;
    }

    this.promise = this.loader();
    this.promise.finally(() => {
      this.promise = null;
    });

    await this.promise;
  }

  async save(): Promise<void> {
    if (this.loading) {
      return;
    }

    try {
      this.loading = true;

      await this.loadInitialState();

      if (!this.isChanged()) {
        return;
      }

      if (this.formState.mode === FormMode.Create) {
        const user = await this.usersResource.create({
          userId: this.state.userId,
        });
        this.initialState.userId = user.userId;
        this.formState.setMode(FormMode.Edit);
      }
      await this.updateCredentials();
      await this.updateTeams();
      await this.updateStatus();
      await this.updateMetaParameters();

      this.usersResource.markOutdated(this.state.userId);
      this.loaded = false;
    } finally {
      this.loading = false;
    }
  }

  private validate(data: IFormState<IUserFormState>, contexts: IExecutionContextProvider<IFormState<IUserFormState>>) {
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
  }
  private configure() {
    const loadableStateContext = this.formState.dataContext.get(DATA_CONTEXT_LOADABLE_STATE);

    loadableStateContext.getState('user-info', () => [getCachedDataResourceLoaderState(this.serverConfigResource, undefined)]);
  }

  private fillDefaultConfig(serverConfig: ServerConfig | null, user: AdminUser | null) {
    user = toJS(user);
    this.initialState.userId = user?.userId || '';
    this.initialState.enabled = user?.enabled || false;
    this.initialState.metaParameters = observable(user?.metaParameters || {});
    this.initialState.teams = observable(user?.grantedTeams || [serverConfig?.defaultUserTeam].filter(isDefined));

    if (this.isChanged()) {
      return;
    }

    this.state = toJS(this.initialState);
  }

  private async updateCredentials() {
    if (this.state.password) {
      await this.usersResource.updateCredentials(this.state.userId, {
        profile: '0',
        credentials: { password: this.state.password },
      });
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

  private async loader() {
    try {
      this.loading = true;
      await this.loadInitialState();
      this.loaded = true;
      this.exception = null;
    } catch (exception: any) {
      this.exception = exception;
    } finally {
      this.loading = false;
    }
  }

  private async loadInitialState() {
    let user: AdminUser | null = null;
    const serverConfig = await this.serverConfigResource.load();

    if (this.formState.mode === FormMode.Edit && this.initialState.userId) {
      user = await this.usersResource.load(this.initialState.userId, ['includeMetaParameters']);
    }

    this.fillDefaultConfig(serverConfig, user);
  }
}
