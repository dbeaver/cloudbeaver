/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { FormPart, formStateContext, type IFormState } from '@cloudbeaver/core-ui';

import type { IConnectionFormState } from '../IConnectionFormState.js';
import type { IConnectionFormOriginInfoState } from './IConnectionFormOriginInfoState.js';
import { ConnectionInfoAuthPropertiesResource, DatabaseAuthModelsResource, DBDriverResource } from '@cloudbeaver/core-connections';
import { AUTH_PROVIDER_LOCAL_ID, AuthProvidersResource, type UserInfoResource } from '@cloudbeaver/core-authentication';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import type { LocalizationService } from '@cloudbeaver/core-localization';
import type { ConnectionFormOptionsPart } from '../Options/ConnectionFormOptionsPart.js';

const defaultStateGetter = () => ({});

export class ConnectionFormOriginInfoFormPart extends FormPart<IConnectionFormOriginInfoState, IConnectionFormState> {
  constructor(
    formState: IFormState<IConnectionFormState>,
    private readonly userInfoResource: UserInfoResource,
    private readonly databaseAuthModelsResource: DatabaseAuthModelsResource,
    private readonly connectionInfoAuthPropertiesResource: ConnectionInfoAuthPropertiesResource,
    private readonly dbDriverResource: DBDriverResource,
    private readonly authProvidersResource: AuthProvidersResource,
    private readonly localizationService: LocalizationService,
    private readonly optionsPart: ConnectionFormOptionsPart,
  ) {
    super(formState, defaultStateGetter());
    this.formState.formStateTask.addHandler(this.formAuthState.bind(this));
  }

  private async formAuthState(data: IConnectionFormState, contexts: IExecutionContextProvider<IConnectionFormState>) {
    const stateContext = contexts.getContext(formStateContext);

    const info = this.optionsPart.connectionKey ? await this.connectionInfoAuthPropertiesResource.load(this.optionsPart.connectionKey) : null;
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

  protected override async loader(): Promise<void> {}

  protected override async saveChanges(): Promise<void> {}
}
