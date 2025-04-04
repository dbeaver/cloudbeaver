/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { FormPart, formStateContext, type IFormState } from '@cloudbeaver/core-ui';

import type { IConnectionFormState } from '../IConnectionFormState.js';
import type { IConnectionFormOriginInfoState } from './IConnectionFormOriginInfoState.js';
import {
  ConnectionInfoAuthPropertiesResource,
  DatabaseAuthModelsResource,
  DBDriverResource,
  type ConnectionInfoOriginDetailsResource,
} from '@cloudbeaver/core-connections';
import { AUTH_PROVIDER_LOCAL_ID, AuthProvidersResource, type UserInfoResource } from '@cloudbeaver/core-authentication';
import { computed, makeObservable } from 'mobx';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import type { LocalizationService } from '@cloudbeaver/core-localization';
import type { ConnectionFormOptionsPart } from '../Options/ConnectionFormOptionsPart.js';

const defaultStateGetter = () => ({}) as IConnectionFormOriginInfoState;

@injectable()
export class ConnectionFormOriginInfoFormPart extends FormPart<IConnectionFormOriginInfoState, IConnectionFormState> {
  constructor(
    formState: IFormState<IConnectionFormState>,
    private readonly connectionInfoOriginDetailsResource: ConnectionInfoOriginDetailsResource,
    private readonly userInfoResource: UserInfoResource,
    private readonly databaseAuthModelsResource: DatabaseAuthModelsResource,
    private readonly connectionInfoAuthPropertiesResource: ConnectionInfoAuthPropertiesResource,
    private readonly dbDriverResource: DBDriverResource,
    private readonly authProvidersResource: AuthProvidersResource,
    private readonly localizationService: LocalizationService,
    private readonly optionsPart: ConnectionFormOptionsPart,
  ) {
    super(formState, defaultStateGetter());

    makeObservable(this, {
      providerId: computed,
      isAuthenticated: computed,
      authModelId: computed,
    });

    this.formState.formStateTask.addHandler(this.formAuthState.bind(this));
  }

  override isOutdated(): boolean {
    if (!this.optionsPart.connectionKey || !this.optionsPart.state.driverId) {
      return false;
    }

    if (
      this.dbDriverResource.isOutdated(this.optionsPart.state.driverId) ||
      this.connectionInfoAuthPropertiesResource.isOutdated(this.optionsPart.connectionKey)
    ) {
      return true;
    }

    if (!this.authModelId) {
      return false;
    }

    if (this.databaseAuthModelsResource.isOutdated(this.authModelId) || this.userInfoResource.isOutdated()) {
      return true;
    }

    if (this.isAuthenticated && this.connectionInfoOriginDetailsResource.isOutdated(this.optionsPart.connectionKey)) {
      return true;
    }

    return false;
  }

  get providerId(): string | null {
    if (!this.formState.state.projectId || !this.optionsPart.state.driverId) {
      return null;
    }

    const driver = this.dbDriverResource.get(this.optionsPart.state.driverId);

    if (!driver) {
      return null;
    }

    const info = this.optionsPart.connectionKey ? this.connectionInfoAuthPropertiesResource.get(this.optionsPart.connectionKey) : null;
    const authModel = this.databaseAuthModelsResource.get(this.optionsPart.state.authModelId ?? info?.authModel ?? driver?.defaultAuthModel ?? null);

    return authModel?.requiredAuth ?? info?.requiredAuth ?? AUTH_PROVIDER_LOCAL_ID;
  }

  get isAuthenticated(): boolean {
    if (!this.providerId) {
      return false;
    }

    return this.userInfoResource.hasToken(this.providerId);
  }

  get authModelId(): string | null {
    const driver = this.dbDriverResource.get(this.optionsPart.state.driverId!)!;
    const info = this.optionsPart.connectionKey ? this.connectionInfoAuthPropertiesResource.get(this.optionsPart.connectionKey) : null;

    return this.optionsPart.state.authModelId ?? info?.authModel ?? driver?.defaultAuthModel ?? null;
  }

  private async formAuthState(data: IConnectionFormState, contexts: IExecutionContextProvider<IConnectionFormState>) {
    const stateContext = contexts.getContext(formStateContext);

    const info = this.optionsPart.connectionKey ? this.connectionInfoAuthPropertiesResource.get(this.optionsPart.connectionKey) : null;
    const driver = await this.dbDriverResource.load(this.optionsPart.state.driverId!, ['includeProviderProperties', 'includeMainProperties']);
    const [authModel] = await Promise.all([this.databaseAuthModelsResource.load(driver.defaultAuthModel), this.userInfoResource.load()]);
    const providerId = authModel.requiredAuth ?? info?.requiredAuth ?? AUTH_PROVIDER_LOCAL_ID;

    if (!this.userInfoResource.hasToken(providerId)) {
      const provider = await this.authProvidersResource.load(providerId);
      const message = this.localizationService.translate('plugin_connections_connection_cloud_auth_required', undefined, {
        providerLabel: provider.label,
      });
      stateContext.setInfo(message);
      stateContext.readonly = this.formState.mode === 'edit';
    }
  }

  protected override async loader(): Promise<void> {
    const state = defaultStateGetter();

    if (!this.optionsPart.connectionKey || !this.optionsPart.state.driverId) {
      this.setInitialState(state);
      return;
    }

    await Promise.all([
      this.dbDriverResource.load(this.optionsPart.state.driverId),
      this.connectionInfoAuthPropertiesResource.load(this.optionsPart.connectionKey),
    ]);

    if (!this.authModelId) {
      throw new Error('Auth model is not defined');
    }

    await Promise.all([this.databaseAuthModelsResource.load(this.authModelId), this.userInfoResource.load()]);

    if (!this.isAuthenticated) {
      this.setInitialState(state);
      return;
    }

    const originInfo = await this.connectionInfoOriginDetailsResource.load(this.optionsPart.connectionKey);

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
