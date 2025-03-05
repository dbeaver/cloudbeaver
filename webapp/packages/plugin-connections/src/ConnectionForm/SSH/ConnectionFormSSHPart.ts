/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { FormPart, formValidationContext, type IFormState } from '@cloudbeaver/core-ui';

import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { DriverConfigurationType, NetworkHandlerAuthType, type NetworkHandlerConfigInput } from '@cloudbeaver/core-sdk';
import { ConnectionInfoResource, createConnectionParam, SSH_TUNNEL_ID } from '@cloudbeaver/core-connections';
import { toJS } from 'mobx';
import { connectionCredentialsStateContext } from '../Contexts/connectionCredentialsStateContext.js';
import type { IConnectionFormStateRefactored } from '../IConnectionFormStateRefactored.js';
import type { INetworkHandlerConfig } from '../Options/IConnectionNetworkHanler.js';

const DEFAULT_SSH_NETWORK_HANDLER: INetworkHandlerConfig = {
  id: SSH_TUNNEL_ID,
  enabled: false,
  authType: NetworkHandlerAuthType.Password,
  password: '',
  savePassword: false,
  userName: '',
  key: '',
  properties: {
    port: 22,
    host: '',
    aliveInterval: '0',
    sshConnectTimeout: '10000',
  },
};
export class ConnectionFormSSHPart extends FormPart<INetworkHandlerConfig, IConnectionFormStateRefactored> {
  constructor(
    formState: IFormState<IConnectionFormStateRefactored>,
    private readonly connectionInfoResource: ConnectionInfoResource,
  ) {
    super(formState, DEFAULT_SSH_NETWORK_HANDLER);
  }

  override get isChanged(): boolean {
    if (!this.state.enabled) {
      return false;
    }

    if (
      this.state.properties?.['host'] !== this.initialState?.properties?.['host'] ||
      this.state.properties?.['aliveInterval'] !== this.initialState?.properties?.['aliveInterval'] ||
      this.state.properties?.['sshConnectTimeout'] !== this.initialState?.properties?.['sshConnectTimeout']
    ) {
      return true;
    }

    return super.isChanged;
  }

  protected override async loader(): Promise<void> {
    if (!this.formState.state.config.connectionId || !this.formState.state.projectId) {
      this.setInitialState(DEFAULT_SSH_NETWORK_HANDLER);
      return;
    }

    const info = await this.connectionInfoResource.load(
      createConnectionParam(this.formState.state.projectId, this.formState.state.config.connectionId!),
    );
    const sshNetworkHandler = info?.networkHandlersConfig?.find(handler => handler.id === SSH_TUNNEL_ID);

    this.setInitialState(sshNetworkHandler ?? DEFAULT_SSH_NETWORK_HANDLER);
  }

  protected override async saveChanges(
    data: IFormState<IConnectionFormStateRefactored>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormStateRefactored>>,
  ): Promise<void> {
    // const info = await this.connectionInfoResource.load(
    //   createConnectionParam(this.formState.state.projectId, this.formState.state.config.connectionId!),
    // );
    // const networkHandlersConfig = info?.networkHandlersConfig ?? [];
    // const sshNetworkHandlerIndex = networkHandlersConfig.findIndex(handler => handler.id === SSH_TUNNEL_ID);
    // const updatedNetworkHandlersConfig = [
    //   ...networkHandlersConfig.slice(0, sshNetworkHandlerIndex),
    //   this.state,
    //   ...networkHandlersConfig.slice(sshNetworkHandlerIndex + 1),
    // ];
    // await this.connectionInfoResource.update(createConnectionParam(this.formState.state.projectId, this.formState.state.config.connectionId!), {
    //   networkHandlersConfig: updatedNetworkHandlersConfig,
    // });
  }

  protected override format(
    data: IFormState<IConnectionFormStateRefactored>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormStateRefactored>>,
  ): void | Promise<void> {
    const config = this.formState.state.config;
    const credentialsState = contexts.getContext(connectionCredentialsStateContext);
    const urlType = config.configurationType === DriverConfigurationType.Url;

    if (urlType) {
      return;
    }

    let handlerConfig: INetworkHandlerConfig | undefined;

    if (this.isChanged) {
      handlerConfig = {
        ...this.state,
        savePassword: this.state.savePassword || config.sharedCredentials,
        key: this.state.authType === NetworkHandlerAuthType.PublicKey ? this.state.key : undefined,
        password: this.state.password,
      };

      delete handlerConfig?.secureProperties;
    }

    if (this.state.enabled && !this.state.savePassword) {
      credentialsState.requireNetworkHandler(this.state.id);
    }

    if (handlerConfig) {
      this.setState(getTrimmedSSHConfig(handlerConfig));
    }
  }

  protected override validate(
    data: IFormState<IConnectionFormStateRefactored>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormStateRefactored>>,
  ): void | Promise<void> {
    const validation = contexts.getContext(formValidationContext);

    if (this.state.enabled) {
      if (this.isChanged) {
        if (this.state.savePassword && !this.state.userName?.length) {
          validation.error("Field SSH 'User' can't be empty");
        }

        if (!this.state.properties?.['host'].length) {
          validation.error("Field SSH 'Host' can't be empty");
        }

        const port = Number(this.state.properties?.['port']);
        if (Number.isNaN(port) || port < 1) {
          validation.error("Field SSH 'Port' can't be empty");
        }
      }

      const keyAuth = this.state.authType === NetworkHandlerAuthType.PublicKey;
      const keySaved = this.initialState?.key === '';

      if (keyAuth && this.state.savePassword && !keySaved && !this.state.key?.length) {
        validation.error("Field SSH 'Private key' can't be empty");
      }

      const passwordSaved = this.initialState?.password === '' && this.initialState?.authType === this.state.authType;
      if (!keyAuth && this.state.savePassword && !passwordSaved && !this.state.password?.length) {
        validation.error("Field SSH 'Password' can't be empty");
      }
    }
  }
}

function getTrimmedSSHConfig(input: NetworkHandlerConfigInput): NetworkHandlerConfigInput {
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
