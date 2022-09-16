/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AuthProvidersResource, AUTH_PROVIDER_LOCAL_ID, UserInfoResource } from '@cloudbeaver/core-authentication';
import { isLocalConnection } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { LocalizationService } from '@cloudbeaver/core-localization';

import { connectionFormConfigureContext } from '../connectionFormConfigureContext';
import { ConnectionFormService } from '../ConnectionFormService';
import { connectionFormStateContext } from '../Contexts/connectionFormStateContext';
import type { IConnectionFormState } from '../IConnectionFormProps';
import { ConnectionFormAuthenticationAction } from './ConnectionFormAuthenticationAction';
import { OriginInfo } from './OriginInfo';
import { OriginInfoTab } from './OriginInfoTab';

@injectable()
export class ConnectionOriginInfoTabService extends Bootstrap {
  constructor(
    private readonly connectionFormService: ConnectionFormService,
    private readonly userInfoResource: UserInfoResource,
    private readonly authProvidersResource: AuthProvidersResource,
    private readonly localizationService: LocalizationService
  ) {
    super();
  }

  register(): void {
    this.connectionFormService.tabsContainer.add({
      key: 'origin',
      order: 3,
      tab: () => OriginInfoTab,
      panel: () => OriginInfo,
      stateGetter: () => () => ({}),
      isHidden: (tabId, props) => props?.state.info ? isLocalConnection(props.state.info) : true,
    });

    this.connectionFormService.configureTask
      .addHandler(this.configure.bind(this));

    this.connectionFormService.formStateTask
      .addHandler(this.formState.bind(this));

    this.connectionFormService.actionsContainer
      .add(ConnectionFormAuthenticationAction, 0);
  }

  load(): void { }

  private configure(data: IConnectionFormState, contexts: IExecutionContextProvider<IConnectionFormState>) {
    const configuration = contexts.getContext(connectionFormConfigureContext);

    configuration.include('includeOrigin');
  }

  private async formState(data: IConnectionFormState, contexts: IExecutionContextProvider<IConnectionFormState>) {
    const providerId = data.info?.requiredAuth;

    if (!providerId || providerId === AUTH_PROVIDER_LOCAL_ID || data.mode !== 'edit') {
      return;
    }

    const context = contexts.getContext(connectionFormStateContext);

    await this.userInfoResource.load(undefined, []);
    const provider = await this.authProvidersResource.load(providerId);

    if (!this.userInfoResource.hasToken(providerId)) {
      context.readonly = true;
      const message = this.localizationService.translate('connections_public_connection_cloud_auth_required', undefined, { providerLabel: provider.label });
      context.setStatusMessage(message);
    }
  }
}
