/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, toJS } from 'mobx';
import React from 'react';

import { DBDriverResource, SSH_TUNNEL_ID } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { DriverConfigurationType, NetworkHandlerAuthType, type NetworkHandlerConfigInput } from '@cloudbeaver/core-sdk';
import { formStateContext } from '@cloudbeaver/core-ui';

import { connectionFormConfigureContext } from '../connectionFormConfigureContext.js';
import { ConnectionFormService } from '../ConnectionFormService.js';
import { connectionConfigContext } from '../Contexts/connectionConfigContext.js';
import { connectionCredentialsStateContext } from '../Contexts/connectionCredentialsStateContext.js';
import type { IConnectionFormFillConfigData, IConnectionFormState, IConnectionFormSubmitData } from '../IConnectionFormProps.js';

export const SSHTab = React.lazy(async () => {
  const { SSHTab } = await import('./SSHTab.js');
  return { default: SSHTab };
});
export const SSHPanel = React.lazy(async () => {
  const { SSHPanel } = await import('./SSHPanel.js');
  return { default: SSHPanel };
});

@injectable()
export class ConnectionSSHTabService extends Bootstrap {
  constructor(
    private readonly connectionFormService: ConnectionFormService,
    private readonly dbDriverResource: DBDriverResource,
  ) {
    super();

    makeObservable<this, 'fillConfig' | 'prepareConfig'>(this, {
      fillConfig: action,
      prepareConfig: action,
    });
  }

  override register(): void {
    this.connectionFormService.tabsContainer.add({
      key: 'ssh',
      name: 'plugin_connections_connection_form_part_main',
      order: 3,
      tab: () => SSHTab,
      panel: () => SSHPanel,
      isHidden: (tabId, props) => {
        if (props?.state.config.driverId) {
          const driver = this.dbDriverResource.get(props.state.config.driverId);
          const urlType = props.state.config.configurationType === DriverConfigurationType.Url;

          return urlType || !driver?.applicableNetworkHandlers.includes(SSH_TUNNEL_ID);
        }

        return true;
      },
    });

    this.connectionFormService.prepareConfigTask.addHandler(this.prepareConfig.bind(this));

    this.connectionFormService.formValidationTask.addHandler(this.validate.bind(this));

    this.connectionFormService.formStateTask.addHandler(this.formState.bind(this));

    this.connectionFormService.configureTask.addHandler(this.configure.bind(this));

    this.connectionFormService.fillConfigTask.addHandler(this.fillConfig.bind(this));
  }

  private fillConfig({ state, updated }: IConnectionFormFillConfigData, contexts: IExecutionContextProvider<IConnectionFormFillConfigData>) {
    if (!updated) {
      return;
    }
    const initialConfig = state.info?.networkHandlersConfig?.find(handler => handler.id === SSH_TUNNEL_ID);

    if (!state.config.networkHandlersConfig) {
      state.config.networkHandlersConfig = [];
    }

    if (!state.config.networkHandlersConfig.some(state => state.id === SSH_TUNNEL_ID)) {
      state.config.networkHandlersConfig.push({
        id: SSH_TUNNEL_ID,
        enabled: false,
        authType: NetworkHandlerAuthType.Password,
        password: '',
        savePassword: false,
        userName: '',
        key: '',
        ...initialConfig,
        properties: {
          port: 22,
          host: '',
          aliveInterval: '0',
          sshConnectTimeout: '10000',
          ...initialConfig?.properties,
        },
      });
    }
  }

  private configure(data: IConnectionFormState, contexts: IExecutionContextProvider<IConnectionFormState>) {
    const configuration = contexts.getContext(connectionFormConfigureContext);

    configuration.include('includeNetworkHandlersConfig');
  }

  private validate({ state: { config, info } }: IConnectionFormSubmitData, contexts: IExecutionContextProvider<IConnectionFormSubmitData>) {
    const validation = contexts.getContext(this.connectionFormService.connectionValidationContext);

    if (!config.networkHandlersConfig) {
      return;
    }

    const handler = config.networkHandlersConfig.find(handler => handler.id === SSH_TUNNEL_ID);

    if (!handler) {
      return;
    }

    if (handler.enabled) {
      const initial = info?.networkHandlersConfig?.find(h => h.id === handler.id);
      if (this.isChanged(handler, initial)) {
        if (handler.savePassword && !handler.userName?.length) {
          validation.error("Field SSH 'User' can't be empty");
        }

        if (!handler.properties?.host?.length) {
          validation.error("Field SSH 'Host' can't be empty");
        }

        const port = Number(handler.properties?.port);
        if (Number.isNaN(port) || port < 1) {
          validation.error("Field SSH 'Port' can't be empty");
        }
      }

      const keyAuth = handler.authType === NetworkHandlerAuthType.PublicKey;
      const keySaved = initial?.key === '';
      if (keyAuth && handler.savePassword && !keySaved && !handler.key?.length) {
        validation.error("Field SSH 'Private key' can't be empty");
      }

      const passwordSaved = initial?.password === '' && initial.authType === handler.authType;
      if (!keyAuth && handler.savePassword && !passwordSaved && !handler.password?.length) {
        validation.error("Field SSH 'Password' can't be empty");
      }
    }
  }

  private prepareConfig({ state }: IConnectionFormSubmitData, contexts: IExecutionContextProvider<IConnectionFormSubmitData>) {
    const config = contexts.getContext(connectionConfigContext);
    const credentialsState = contexts.getContext(connectionCredentialsStateContext);
    const urlType = state.config.configurationType === DriverConfigurationType.Url;

    if (urlType || !state.config.networkHandlersConfig || state.config.networkHandlersConfig.length === 0) {
      return;
    }

    let handlerConfig: NetworkHandlerConfigInput | undefined;

    const handler = state.config.networkHandlersConfig.find(handler => handler.id === SSH_TUNNEL_ID);

    if (!handler) {
      return;
    }

    const initial = state.info?.networkHandlersConfig?.find(h => h.id === handler.id);
    const passwordChanged = this.isPasswordChanged(handler, initial);
    const keyChanged = this.isKeyChanged(handler, initial);

    if (this.isChanged(handler, initial) || passwordChanged || keyChanged) {
      handlerConfig = {
        ...handler,
        savePassword: handler.savePassword || config.sharedCredentials,
        key: handler.authType === NetworkHandlerAuthType.PublicKey && keyChanged ? handler.key : undefined,
        password: passwordChanged ? handler.password : undefined,
      };

      delete handlerConfig.secureProperties;
    }

    if (handler.enabled && !handler.savePassword) {
      credentialsState.requireNetworkHandler(handler.id);
    }

    if (handlerConfig) {
      if (!config.networkHandlersConfig) {
        config.networkHandlersConfig = [];
      }

      handlerConfig = this.getTrimmedSSHConfig(handlerConfig);
      config.networkHandlersConfig.push(handlerConfig);
    }
  }

  private getTrimmedSSHConfig(input: NetworkHandlerConfigInput): NetworkHandlerConfigInput {
    const trimmedInput = toJS(input);
    const attributesToTrim = Object.keys(input) as (keyof NetworkHandlerConfigInput)[];

    for (const key of attributesToTrim) {
      if (typeof trimmedInput[key] === 'string') {
        trimmedInput[key] = trimmedInput[key]?.trim();
      }
    }

    for (const key in trimmedInput.properties) {
      if (typeof trimmedInput.properties[key] === 'string') {
        trimmedInput.properties[key] = trimmedInput.properties[key]?.trim();
      }
    }

    return trimmedInput;
  }

  private formState(data: IConnectionFormState, contexts: IExecutionContextProvider<IConnectionFormState>) {
    const config = contexts.getContext(connectionConfigContext);
    if (config.networkHandlersConfig !== undefined) {
      const stateContext = contexts.getContext(formStateContext);

      stateContext.markEdited();
    }
  }

  private isChanged(handler: NetworkHandlerConfigInput, initial?: NetworkHandlerConfigInput) {
    if (!initial && !handler.enabled) {
      return false;
    }

    const port = Number(initial?.properties?.port);
    const formPort = Number(handler.properties?.port);

    if (
      handler.enabled !== initial?.enabled ||
      handler.authType !== initial?.authType ||
      handler.savePassword !== initial?.savePassword ||
      handler.userName !== initial?.userName ||
      handler.properties?.host !== initial?.properties?.host ||
      port !== formPort ||
      handler.properties?.aliveInterval !== initial?.properties?.aliveInterval ||
      handler.properties?.sshConnectTimeout !== initial?.properties?.sshConnectTimeout
    ) {
      return true;
    }

    return false;
  }

  private isPasswordChanged(handler: NetworkHandlerConfigInput, initial?: NetworkHandlerConfigInput) {
    if (!initial && !handler.enabled) {
      return false;
    }

    return (
      (((initial?.password === null && handler.password !== null) || initial?.password === '') && handler.password !== '') ||
      !!handler.password?.length
    );
  }

  private isKeyChanged(handler: NetworkHandlerConfigInput, initial?: NetworkHandlerConfigInput) {
    if (!initial && !handler.enabled) {
      return false;
    }

    return (((initial?.key === null && handler.key !== null) || initial?.key === '') && handler.key !== '') || !!handler.key?.length;
  }
}
