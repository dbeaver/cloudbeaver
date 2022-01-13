/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { DatabaseConnection, DBDriverResource, SSH_TUNNEL_ID } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { NetworkHandlerAuthType, NetworkHandlerConfigInput } from '@cloudbeaver/core-sdk';

import { connectionFormConfigureContext } from '../connectionFormConfigureContext';
import { ConnectionFormService } from '../ConnectionFormService';
import { connectionConfigContext } from '../Contexts/connectionConfigContext';
import { connectionCredentialsStateContext } from '../Contexts/connectionCredentialsStateContext';
import { connectionFormStateContext } from '../Contexts/connectionFormStateContext';
import type { IConnectionFormFillConfigData, IConnectionFormState, IConnectionFormSubmitData } from '../IConnectionFormProps';
import { SSH } from './SSH';
import { SSHTab } from './SSHTab';

@injectable()
export class ConnectionSSHTabService extends Bootstrap {
  constructor(
    private readonly connectionFormService: ConnectionFormService,
    private readonly dbDriverResource: DBDriverResource
  ) {
    super();
  }

  register(): void {
    this.connectionFormService.tabsContainer.add({
      key: 'ssh',
      name: 'customConnection_options',
      order: 3,
      tab: () => SSHTab,
      panel: () => SSH,
      isHidden: (tabId, props) => {
        if (props?.state.config.driverId) {
          const driver = this.dbDriverResource.get(props?.state.config.driverId);

          return !driver?.applicableNetworkHandlers.includes(SSH_TUNNEL_ID);
        }
        return true;
      },
    });

    this.connectionFormService.prepareConfigTask
      .addHandler(this.prepareConfig.bind(this));

    this.connectionFormService.formValidationTask
      .addHandler(this.validate.bind(this));

    this.connectionFormService.formStateTask
      .addHandler(this.formState.bind(this));

    this.connectionFormService.configureTask
      .addHandler(this.configure.bind(this));

    this.connectionFormService.fillConfigTask
      .addHandler(this.fillConfig.bind(this));
  }

  load(): void { }

  private fillConfig(
    { state, updated }: IConnectionFormFillConfigData,
    contexts: IExecutionContextProvider<IConnectionFormFillConfigData>
  ) {
    if (!updated) {
      return;
    }
    const initialConfig = state.info?.networkHandlersConfig.find(handler => handler.id === SSH_TUNNEL_ID);

    if (!state.config.networkHandlersConfig) {
      state.config.networkHandlersConfig = [];
    }

    if (!state.config.networkHandlersConfig.some(state => state.id === SSH_TUNNEL_ID)) {
      state.config.networkHandlersConfig.push({
        id: SSH_TUNNEL_ID,
        enabled: false,
        authType: NetworkHandlerAuthType.Password,
        password: '',
        savePassword: true,
        userName: '',
        key: '',
        ...initialConfig,
        properties: {
          port: 22,
          host: '',
          ...initialConfig?.properties,
        },
      });
    }
  }

  private configure(data: IConnectionFormState, contexts: IExecutionContextProvider<IConnectionFormState>) {
    const configuration = contexts.getContext(connectionFormConfigureContext);

    configuration.include('customIncludeNetworkHandlerCredentials');
  }

  private validate(
    {
      state: {
        config,
        info,
      },
    }: IConnectionFormSubmitData,
    contexts: IExecutionContextProvider<IConnectionFormSubmitData>
  ) {
    const validation = contexts.getContext(this.connectionFormService.connectionValidationContext);

    if (!config.networkHandlersConfig) {
      return;
    }

    for (const handler of config.networkHandlersConfig) {
      if (handler.enabled && this.isChanged(handler, info)) {
        if (handler.savePassword) {
          if (!handler.userName?.length) {
            validation.error("Field SSH 'User' can't be empty");
          }
          if (handler.authType === NetworkHandlerAuthType.Password && !handler.password?.length) {
            validation.error("Field SSH 'Password' can't be empty");
          }
          if (handler.authType === NetworkHandlerAuthType.PublicKey && !handler.key?.length) {
            validation.error("Field SSH 'Private key' can't be empty");
          }
        }

        if (!handler.properties?.host?.length) {
          validation.error("Field SSH 'Host' can't be empty");
        }

        const port = Number(handler.properties?.port);
        if (Number.isNaN(port) || port < 1) {
          validation.error("Field SSH 'Port' can't be empty");
        }
      }
    }
  }

  private async prepareConfig(
    {
      state,
    }: IConnectionFormSubmitData,
    contexts: IExecutionContextProvider<IConnectionFormSubmitData>
  ) {
    const config = contexts.getContext(connectionConfigContext);
    const credentialsState = contexts.getContext(connectionCredentialsStateContext);

    if (!state.config.networkHandlersConfig || state.config.networkHandlersConfig.length === 0) {
      return;
    }

    const configs: NetworkHandlerConfigInput[] = [];

    for (const handler of state.config.networkHandlersConfig) {
      if (this.isChanged(handler, state.info)) {
        configs.push({ ...handler });
      }
      if (handler.enabled && !handler.savePassword) {
        credentialsState.requireNetworkHandler(handler.id);
      }
    }

    if (configs.length > 0) {
      config.networkHandlersConfig = configs;
    }
  }

  private formState(
    data: IConnectionFormState,
    contexts: IExecutionContextProvider<IConnectionFormState>
  ) {
    const config = contexts.getContext(connectionConfigContext);
    if (config.networkHandlersConfig !== undefined) {
      const stateContext = contexts.getContext(connectionFormStateContext);

      stateContext.markEdited();
    }
  }

  private isChanged(handler: NetworkHandlerConfigInput, info?: DatabaseConnection) {
    const initialConfig = info?.networkHandlersConfig.find(h => h.id === handler.id);
    if (!initialConfig && !handler.enabled) {
      return false;
    }

    const port = Number(initialConfig?.properties?.port);
    const formPort = Number(handler.properties?.port);

    const passwordChanged = (
      (((initialConfig?.password === null && handler.password !== null) || initialConfig?.password === '') && handler.password !== '')
      || !!handler.password?.length
    );

    if (handler.enabled !== initialConfig?.enabled
      || handler.savePassword !== initialConfig?.savePassword
      || handler.userName !== initialConfig?.userName
      || passwordChanged
      || handler.properties?.host !== initialConfig?.properties?.host
      || port !== formPort) {
      return true;
    }

    return false;
  }
}
