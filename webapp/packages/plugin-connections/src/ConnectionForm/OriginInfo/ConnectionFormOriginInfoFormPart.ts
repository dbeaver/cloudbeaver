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
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';

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
      authModelId: computed,
    });
  }

  get optionsPart() {
    return getConnectionFormOptionsPart(this.formState);
  }

  get providerId(): string | null {
    if (!this.formState.state.projectId || !this.optionsPart.state.driverId) {
      return null;
    }

    const driver = this.dbDriverResource.get(this.optionsPart.state.driverId);

    if (!driver) {
      return null;
    }

    const info = this.connectionInfoResource.get(createConnectionParam(this.formState.state.projectId, this.optionsPart.state.connectionId!));
    const authModel = this.databaseAuthModelsResource.get(this.optionsPart.state.authModelId ?? info?.authModel ?? driver?.defaultAuthModel ?? null);
    const providerId = authModel?.requiredAuth ?? info?.requiredAuth ?? AUTH_PROVIDER_LOCAL_ID;

    return providerId;
  }

  get isAuthenticated(): boolean {
    if (!this.providerId) {
      return false;
    }

    return this.userInfoResource.hasToken(this.providerId);
  }

  get authModelId(): string | null {
    const optionsPart = getConnectionFormOptionsPart(this.formState);
    const driver = this.dbDriverResource.get(optionsPart.state.driverId!)!;
    const info = this.connectionInfoResource.get(createConnectionParam(this.formState.state.projectId, optionsPart.state.connectionId!));

    return optionsPart.state.authModelId ?? info?.authModel ?? driver?.defaultAuthModel ?? null;
  }

  protected override async loader(): Promise<void> {
    const state = defaultStateGetter();
    const optionsPart = getConnectionFormOptionsPart(this.formState);
    const connectionId = optionsPart.state.connectionId;

    if (!connectionId || !this.formState.state.projectId || !optionsPart.state.driverId) {
      this.setInitialState(state);
      return;
    }

    await this.dbDriverResource.load(optionsPart.state.driverId);

    if (!this.authModelId) {
      throw new Error('Auth model is not defined');
    }

    await Promise.all([this.databaseAuthModelsResource.load(this.authModelId), this.userInfoResource.load()]);

    if (!this.isAuthenticated) {
      this.setInitialState(state);
      return;
    }

    const originInfo = await this.connectionInfoOriginDetailsResource.load(createConnectionParam(this.formState.state.projectId, connectionId));

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
