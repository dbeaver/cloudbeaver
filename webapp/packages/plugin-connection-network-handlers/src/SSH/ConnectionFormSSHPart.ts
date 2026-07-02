/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { FormPart, formValidationContext, type IFormState } from '@cloudbeaver/core-ui';

import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { DriverConfigurationType, type NetworkHandlerConfigInput, type NetworkHandlerDescriptor } from '@cloudbeaver/core-sdk';
import { ConnectionInfoNetworkHandlersResource } from '@cloudbeaver/core-connections';
import {
  getNetworkHandlerDefaultProperties,
  getSSHHandlerConfig,
  NetworkHandlerResource,
  SSH_DEFAULT_HANDLER_CONFIG,
  SSH_TUNNEL_ID,
  validateSSHConfig,
  type INetworkHandlerConfig,
} from '@cloudbeaver/plugin-network-handlers';
import { toJS } from 'mobx';
import type { ConnectionFormOptionsPart, IConnectionFormState } from '@cloudbeaver/plugin-connections';

const getDefaultState = (): INetworkHandlerConfig => SSH_DEFAULT_HANDLER_CONFIG() as INetworkHandlerConfig;

export class ConnectionFormSSHPart extends FormPart<INetworkHandlerConfig, IConnectionFormState> {
  constructor(
    formState: IFormState<IConnectionFormState>,
    private readonly networkHandlerResource: NetworkHandlerResource,
    private readonly connectionInfoNetworkHandlersResource: ConnectionInfoNetworkHandlersResource,
    private readonly optionsPart: ConnectionFormOptionsPart,
  ) {
    super(formState, getDefaultState());
  }

  getConfig(): NetworkHandlerConfigInput {
    return getSSHHandlerConfig(this.state, this.initialState, this.optionsPart.state.sharedCredentials);
  }

  override isOutdated(): boolean {
    if (this.networkHandlerResource.isOutdated(SSH_TUNNEL_ID)) {
      return true;
    }
    if (!this.optionsPart.connectionKey) {
      return false;
    }

    return this.connectionInfoNetworkHandlersResource.isOutdated(this.optionsPart.connectionKey);
  }

  protected override async loader(): Promise<void> {
    const handler = await this.networkHandlerResource.load(SSH_TUNNEL_ID);
    if (!this.optionsPart.connectionKey) {
      const state = getDefaultState();
      this.copyInitialHandlerProperties(handler, state);
      this.setInitialState(state);
      return;
    }

    const connection = await this.connectionInfoNetworkHandlersResource.load(this.optionsPart.connectionKey);
    const sshHandler = connection?.networkHandlersConfig?.find(h => h.id === SSH_TUNNEL_ID);

    const state = toJS(sshHandler ?? getDefaultState());
    this.copyInitialHandlerProperties(handler, state);
    this.setInitialState(state);
  }

  private copyInitialHandlerProperties(handlerDescriptor: NetworkHandlerDescriptor, state: INetworkHandlerConfig): void {
    state.properties = {
      ...getNetworkHandlerDefaultProperties(handlerDescriptor),
      ...state.properties,
    };
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

    const config = this.getConfig();

    if (this.state.enabled && !this.state.savePassword) {
      this.formState.state.requiredNetworkHandlersIds.push(this.state.id);
    } else if (!this.state.enabled) {
      this.formState.state.requiredNetworkHandlersIds = this.formState.state.requiredNetworkHandlersIds.filter(id => id !== this.state.id);
    }

    this.optionsPart.state.networkHandlersConfig!.push(config);
  }

  protected override validate(
    data: IFormState<IConnectionFormState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormState>>,
  ): void | Promise<void> {
    const validation = contexts.getContext(formValidationContext);

    if (!this.isChanged || !this.state.enabled || this.isReadOnly) {
      return;
    }

    for (const error of validateSSHConfig(this.state, this.initialState)) {
      validation.error(error);
    }
  }
}
