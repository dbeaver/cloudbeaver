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
import { ConnectionInfoNetworkHandlersResource, SSH_TUNNEL_ID } from '@cloudbeaver/core-connections';
import { toJS } from 'mobx';
import type { IConnectionFormState } from '../IConnectionFormState.js';
import type { INetworkHandlerConfig } from '../Options/IConnectionNetworkHanler.js';
import { ConnectionFormOptionsPart } from '../Options/ConnectionFormOptionsPart.js';

const getDefaultState = () =>
  ({
    id: SSH_TUNNEL_ID,
    enabled: false,
    authType: NetworkHandlerAuthType.Password,
    // should initially undefined cause if it's empty string it counts as saved password
    password: undefined,
    savePassword: false,
    userName: '',
    // should initially undefined cause if it's empty string it counts as saved private key
    key: undefined,
    properties: {
      port: 22,
      host: '',
      aliveInterval: '0',
      sshConnectTimeout: '10000',
    },
  }) as INetworkHandlerConfig;

export class ConnectionFormSSHPart extends FormPart<INetworkHandlerConfig, IConnectionFormState> {
  constructor(
    formState: IFormState<IConnectionFormState>,
    private readonly connectionInfoNetworkHandlersResource: ConnectionInfoNetworkHandlersResource,
    private readonly optionsPart: ConnectionFormOptionsPart,
  ) {
    super(formState, getDefaultState());
  }

  override isOutdated(): boolean {
    if (!this.optionsPart.connectionKey) {
      return false;
    }

    return this.connectionInfoNetworkHandlersResource.isOutdated(this.optionsPart.connectionKey);
  }

  protected override async loader(): Promise<void> {
    if (!this.optionsPart.connectionKey) {
      this.setInitialState(getDefaultState());
      return;
    }

    const connection = await this.connectionInfoNetworkHandlersResource.load(this.optionsPart.connectionKey);
    const sshHandler = connection?.networkHandlersConfig?.find(h => h.id === SSH_TUNNEL_ID);

    this.setInitialState(sshHandler ?? getDefaultState());
  }

  protected override async saveChanges(
    data: IFormState<IConnectionFormState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormState>>,
  ): Promise<void> {}

  protected override format(
    data: IFormState<IConnectionFormState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormState>>,
  ): void | Promise<void> {
    const urlType = this.optionsPart.state.configurationType === DriverConfigurationType.Url;

    if (urlType) {
      return;
    }

    const passwordChanged = isPasswordChanged(this.state, this.initialState);
    const keyChanged = isKeyChanged(this.state, this.initialState);

    let handlerConfig: NetworkHandlerConfigInput = {
      ...this.state,
      savePassword: this.state.savePassword || this.optionsPart.state.sharedCredentials,
      key: this.state.authType === NetworkHandlerAuthType.PublicKey && keyChanged ? this.state.key : undefined,
      password: passwordChanged ? this.state.password : undefined,
    };

    delete handlerConfig.secureProperties;

    if (this.state.enabled && !this.state.savePassword) {
      this.formState.state.requiredNetworkHandlersIds.push(this.state.id);
    } else if (!this.state.enabled) {
      this.formState.state.requiredNetworkHandlersIds = this.formState.state.requiredNetworkHandlersIds.filter(id => id !== this.state.id);
    }

    if (handlerConfig) {
      handlerConfig = getTrimmedSSHConfig(handlerConfig);
      this.optionsPart.state.networkHandlersConfig!.push(handlerConfig);
    }
  }

  protected override validate(
    data: IFormState<IConnectionFormState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormState>>,
  ): void | Promise<void> {
    const validation = contexts.getContext(formValidationContext);

    if (!this.isChanged || !this.state.enabled) {
      return;
    }

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

function isPasswordChanged(handler: NetworkHandlerConfigInput, initial?: NetworkHandlerConfigInput) {
  if (!initial && !handler.enabled) {
    return false;
  }

  return (
    (((initial?.password === null && handler.password !== null) || initial?.password === '') && handler.password !== '') || !!handler.password?.length
  );
}

function isKeyChanged(handler: NetworkHandlerConfigInput, initial?: NetworkHandlerConfigInput) {
  if (!initial && !handler.enabled) {
    return false;
  }

  return (((initial?.key === null && handler.key !== null) || initial?.key === '') && handler.key !== '') || !!handler.key?.length;
}
