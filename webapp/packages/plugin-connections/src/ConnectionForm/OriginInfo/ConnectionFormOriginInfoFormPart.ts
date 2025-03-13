/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { FormPart, type IFormState } from '@cloudbeaver/core-ui';

import type { IConnectionFormState } from '../IConnectionFormState.js';
import type { IConnectionFormOriginInfoState } from './IConnectionFormOriginInfoState.js';
import {
  ConnectionInfoResource,
  createConnectionParam,
  DatabaseAuthModelsResource,
  DBDriverResource,
  type ConnectionInfoOriginDetailsResource,
} from '@cloudbeaver/core-connections';
import { AUTH_PROVIDER_LOCAL_ID, type UserInfoResource } from '@cloudbeaver/core-authentication';
import { computed, makeObservable } from 'mobx';

const defaultStateGetter = () => ({}) as IConnectionFormOriginInfoState;

@injectable()
export class ConnectionFormOriginInfoFormPart extends FormPart<IConnectionFormOriginInfoState, IConnectionFormState> {
  constructor(
    formState: IFormState<IConnectionFormState>,
    private readonly connectionInfoOriginDetailsResource: ConnectionInfoOriginDetailsResource,
    private readonly userInfoResource: UserInfoResource,
    private readonly databaseAuthModelsResource: DatabaseAuthModelsResource,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly dbDriverResource: DBDriverResource,
  ) {
    super(formState, defaultStateGetter());

    makeObservable(this, {
      providerId: computed,
      isAuthenticated: computed,
    });
  }

  get providerId(): string | null {
    if (!this.formState.state.projectId || !this.formState.state.config.driverId) {
      return null;
    }

    const driver = this.dbDriverResource.get(this.formState.state.config.driverId);

    if (!driver) {
      return null;
    }

    const info = this.connectionInfoResource.get(createConnectionParam(this.formState.state.projectId, this.formState.state.config.connectionId!));
    const authModel = this.databaseAuthModelsResource.get(
      this.formState.state.config.authModelId ?? info?.authModel ?? driver?.defaultAuthModel ?? null,
    );
    const providerId = authModel?.requiredAuth ?? info?.requiredAuth ?? AUTH_PROVIDER_LOCAL_ID;

    return providerId;
  }

  get isAuthenticated(): boolean {
    if (!this.providerId) {
      return false;
    }

    return this.userInfoResource.hasToken(this.providerId);
  }

  protected override async loader(): Promise<void> {
    const state = defaultStateGetter();

    if (!this.formState.state.config.connectionId || !this.formState.state.projectId || !this.formState.state.config.driverId) {
      this.setInitialState(state);
      return;
    }

    const info = this.connectionInfoResource.get(createConnectionParam(this.formState.state.projectId, this.formState.state.config.connectionId));
    const driver = await this.dbDriverResource.load(this.formState.state.config.driverId);
    await this.databaseAuthModelsResource.load(this.formState.state.config.authModelId ?? info?.authModel ?? driver?.defaultAuthModel ?? null);

    if (!this.isAuthenticated) {
      this.setInitialState(state);
      return;
    }

    const originInfo = await this.connectionInfoOriginDetailsResource.load(
      createConnectionParam(this.formState.state.projectId, this.formState.state.config.connectionId),
    );

    if (!originInfo.origin.details) {
      this.setInitialState(state);
      return;
    }

    for (const property of originInfo.origin.details) {
      state[property.id!] = property.value;
    }

    this.setInitialState(state);
  }

  protected override async saveChanges(data: IFormState<IConnectionFormState>): Promise<void> {}
}
