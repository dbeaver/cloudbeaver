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
import type { IConnectionFormState } from '../IConnectionFormState.js';
import type { INetworkHandlerConfig } from '../Options/IConnectionNetworkHanler.js';
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';
import { isNotNullDefined } from '@cloudbeaver/core-utils';

const DEFAULT_SSH_NETWORK_HANDLER: INetworkHandlerConfig = {
  id: SSH_TUNNEL_ID,
  enabled: false,
  authType: NetworkHandlerAuthType.Password,
  // should initially undefined cause if it's empty string it counts as saved password
  password: undefined,
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

export class ConnectionFormSSHPart extends FormPart<INetworkHandlerConfig, IConnectionFormState> {
  constructor(
    formState: IFormState<IConnectionFormState>,
    private readonly connectionInfoResource: ConnectionInfoResource,
  ) {
    super(formState, DEFAULT_SSH_NETWORK_HANDLER);
  }

  protected override async loader(): Promise<void> {
    if (!this.formState.state.config.connectionId || !this.formState.state.projectId) {
      this.setInitialState(DEFAULT_SSH_NETWORK_HANDLER);
      return;
    }

    const connection = await this.connectionInfoResource.load(
      createConnectionParam(this.formState.state.projectId, this.formState.state.config.connectionId),
    );

    this.setInitialState(connection?.networkHandlersConfig?.find(h => h.id === SSH_TUNNEL_ID) ?? DEFAULT_SSH_NETWORK_HANDLER);
  }

  protected override async saveChanges(
    data: IFormState<IConnectionFormState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormState>>,
  ): Promise<void> {}

  protected override format(
    data: IFormState<IConnectionFormState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormState>>,
  ): void | Promise<void> {
    const optionsPart = getConnectionFormOptionsPart(this.formState);
    const urlType = optionsPart.state.configurationType === DriverConfigurationType.Url;

    if (urlType) {
      return;
    }

    let handlerConfig: NetworkHandlerConfigInput | undefined;

    const passwordChanged = this.state.password !== this.initialState?.password;
    const keyChanged = this.state.key !== this.initialState?.key;

    if (this.isChanged || passwordChanged || keyChanged) {
      handlerConfig = {
        ...this.state,
        savePassword: this.state.savePassword || this.formState.state.config.sharedCredentials,
        key: this.state.authType === NetworkHandlerAuthType.PublicKey && keyChanged ? this.state.key : undefined,
        password: passwordChanged ? this.state.password : undefined,
      };

      delete handlerConfig.secureProperties;
    }

    if (handlerConfig) {
      this.state = getTrimmedSSHConfig(handlerConfig);
      const sshConfigIndex = optionsPart.state.networkHandlersConfig?.findIndex(h => h.id === SSH_TUNNEL_ID);

      if (!isNotNullDefined(sshConfigIndex)) {
        return;
      }

      if (sshConfigIndex !== -1) {
        optionsPart.state.networkHandlersConfig![sshConfigIndex] = this.state;
      } else {
        optionsPart.state.networkHandlersConfig?.push(this.state);
      }
    }
  }

  protected override validate(
    data: IFormState<IConnectionFormState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormState>>,
  ): void | Promise<void> {
    const validation = contexts.getContext(formValidationContext);

    if (!this.isChanged) {
      return;
    }

    if (this.state.enabled) {
      if (this.isChanged) {
        if (this.state.savePassword && !this.state.userName?.length) {
          validation.error("Field SSH 'User' can't be empty");
        }

        if (!this.state.properties?.['host']?.length) {
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
