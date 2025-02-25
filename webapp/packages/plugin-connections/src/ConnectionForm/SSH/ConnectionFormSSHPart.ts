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
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';
import { ConnectionInfoResource, createConnectionParam, SSH_TUNNEL_ID } from '@cloudbeaver/core-connections';
import { toJS } from 'mobx';
import { connectionCredentialsStateContext } from '../Contexts/connectionCredentialsStateContext.js';
import type { IConnectionFormStateRefactored } from '../IConnectionFormStateRefactored.js';

export class ConnectionFormSSHPart extends FormPart<void, IConnectionFormStateRefactored> {
  constructor(
    formState: IFormState<IConnectionFormStateRefactored>,
    private readonly connectionInfoResource: ConnectionInfoResource,
  ) {
    super(formState);
  }

  protected override async loader(): Promise<void> {
    if (!this.isChanged) {
      return;
    }
    // TODO should we load instead of get?
    const info = this.connectionInfoResource.get(createConnectionParam(this.formState.state.projectId, this.formState.state.connectionId));
    const initialConfig = info?.networkHandlersConfig?.find(handler => handler.id === SSH_TUNNEL_ID);
    const optionsPart = getConnectionFormOptionsPart(this.formState);

    if (!optionsPart.state.networkHandlersConfig) {
      optionsPart.state.networkHandlersConfig = [];
    }

    if (!optionsPart.state.networkHandlersConfig.some(state => state.id === SSH_TUNNEL_ID)) {
      optionsPart.state.networkHandlersConfig.push({
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

  protected override saveChanges(
    data: IFormState<IConnectionFormStateRefactored>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormStateRefactored>>,
  ): Promise<void> {
    return Promise.resolve();
  }

  protected override format(
    data: IFormState<IConnectionFormStateRefactored>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormStateRefactored>>,
  ): void | Promise<void> {
    const optionsPart = getConnectionFormOptionsPart(this.formState);
    const config = optionsPart.state;
    const credentialsState = contexts.getContext(connectionCredentialsStateContext);
    const urlType = config.configurationType === DriverConfigurationType.Url;
    const info = this.connectionInfoResource.get(createConnectionParam(this.formState.state.projectId, this.formState.state.connectionId));

    if (urlType || !config.networkHandlersConfig || config.networkHandlersConfig.length === 0) {
      return;
    }

    let handlerConfig: NetworkHandlerConfigInput | undefined;

    const handler = config.networkHandlersConfig.find(handler => handler.id === SSH_TUNNEL_ID);

    if (!handler) {
      return;
    }

    const initial = info?.networkHandlersConfig?.find(h => h.id === handler.id);
    const passwordChanged = isPasswordChanged(handler, initial);
    const keyChanged = isKeyChanged(handler, initial);

    if (isChanged(handler, initial) || passwordChanged || keyChanged) {
      handlerConfig = {
        ...handler,
        savePassword: handler.savePassword || config.sharedCredentials,
        key: handler.authType === NetworkHandlerAuthType.PublicKey && keyChanged ? handler.key : undefined,
        password: passwordChanged ? handler.password : undefined,
      };

      delete handlerConfig?.secureProperties;
    }

    if (handler.enabled && !handler.savePassword) {
      credentialsState.requireNetworkHandler(handler.id);
    }

    if (handlerConfig) {
      if (!config.networkHandlersConfig) {
        config.networkHandlersConfig = [];
      }

      handlerConfig = getTrimmedSSHConfig(handlerConfig);
      config.networkHandlersConfig.push(handlerConfig);
    }
  }

  protected override validate(
    data: IFormState<IConnectionFormStateRefactored>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormStateRefactored>>,
  ): void | Promise<void> {
    const validation = contexts.getContext(formValidationContext);
    const optionsPart = getConnectionFormOptionsPart(this.formState);
    const info = this.connectionInfoResource.get(createConnectionParam(this.formState.state.projectId, this.formState.state.connectionId));

    if (!optionsPart.state.networkHandlersConfig) {
      return;
    }

    const handler = optionsPart.state.networkHandlersConfig.find(handler => handler.id === SSH_TUNNEL_ID);

    if (!handler) {
      return;
    }

    if (handler.enabled) {
      const initial = info?.networkHandlersConfig?.find(h => h.id === handler.id);

      if (isChanged(handler, initial)) {
        if (handler.savePassword && !handler.userName?.length) {
          validation.error("Field SSH 'User' can't be empty");
        }

        if (!handler.properties?.['host'].length) {
          validation.error("Field SSH 'Host' can't be empty");
        }

        const port = Number(handler.properties?.['port']);
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
}

function isChanged(handler: NetworkHandlerConfigInput, initial?: NetworkHandlerConfigInput) {
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
