/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { FormPart, type IFormState } from '@cloudbeaver/core-ui';

import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import type { IConnectionFormStateRefactored } from '../IConnectionFormStateRefactored.js';
import { type NetworkHandlerConfigInput } from '@cloudbeaver/core-sdk';
import { isNotNullDefined } from '@cloudbeaver/core-utils';
import { getSSLDriverHandler } from './getSSLDriverHandler.js';
import {
  createConnectionParam,
  type ConnectionInfoResource,
  type DBDriverResource,
  type NetworkHandlerResource,
} from '@cloudbeaver/core-connections';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { toJS } from 'mobx';
import { connectionCredentialsStateContext } from '../Contexts/connectionCredentialsStateContext.js';
import { PROPERTY_FEATURE_SECURED } from './PROPERTY_FEATURE_SECURED.js';
import { SSL_CODE_NAME } from './SSL_CODE_NAME.js';
import type { INetworkHandlerConfig } from '../Options/IConnectionNetworkHanler.js';
import { getSSLDefaultConfig } from './getSSLDefaultConfig.js';
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';

const DEFAULT_SSL_NETWORK_HANDLER: INetworkHandlerConfig = {
  id: SSL_CODE_NAME,
  enabled: false,
  properties: {},
  secureProperties: {},
};

export class ConnectionFormSSLPart extends FormPart<INetworkHandlerConfig, IConnectionFormStateRefactored> {
  constructor(
    formState: IFormState<IConnectionFormStateRefactored>,
    private readonly dbDriverResource: DBDriverResource,
    private readonly networkHandlerResource: NetworkHandlerResource,
    private readonly connectionInfoResource: ConnectionInfoResource,
  ) {
    super(formState, DEFAULT_SSL_NETWORK_HANDLER);
  }

  protected override async loader(): Promise<void> {
    if (!this.formState.state.config.driverId) {
      return;
    }

    const driver = await this.dbDriverResource.load(this.formState.state.config.driverId);
    const handlers = await this.networkHandlerResource.load(CachedMapAllKey);

    const handler = getSSLDriverHandler(handlers, driver?.applicableNetworkHandlers ?? []);

    if (!handler) {
      return;
    }

    const info = this.connectionInfoResource.get(createConnectionParam(this.formState.state.projectId, this.formState.state.config.connectionId!));
    const initialConfig = info?.networkHandlersConfig?.find(h => h.id === handler.id);

    if (!this.formState.state.config.networkHandlersConfig?.some(state => state.id === handler.id)) {
      const config: NetworkHandlerConfigInput = initialConfig ? toJS(initialConfig) : getSSLDefaultConfig(handler.id);

      if (config.secureProperties) {
        config.properties = { ...config.properties, ...config.secureProperties };
      }

      this.setInitialState(config);
      return;
    }

    this.setInitialState(initialConfig ?? DEFAULT_SSL_NETWORK_HANDLER);
  }

  protected override async format(
    data: IFormState<IConnectionFormStateRefactored>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormStateRefactored>>,
  ): Promise<void> {
    const credentialsState = contexts.getContext(connectionCredentialsStateContext);
    const optionsPart = getConnectionFormOptionsPart(this.formState);

    if (!this.isChanged || !this.formState.state.config.driverId) {
      return;
    }

    const driver = await this.dbDriverResource.load(this.formState.state.config.driverId);
    const handlers = await this.networkHandlerResource.load(CachedMapAllKey);
    const handler = driver?.applicableNetworkHandlers.includes(this.state.id) ? this.state : undefined;
    const descriptor = handlers.find(h => h.id === handler?.id);

    if (!handler) {
      return;
    }

    const handlerConfig: NetworkHandlerConfigInput = toJS(handler);
    handlerConfig.savePassword = handler.savePassword || optionsPart.state.sharedCredentials;

    if (this.isChanged && descriptor) {
      for (const descriptorProperty of descriptor.properties) {
        if (!descriptorProperty.id) {
          continue;
        }

        const key = descriptorProperty.id;
        const isDefault = isNotNullDefined(descriptorProperty.defaultValue);

        if (!(key in handlerConfig.properties) && isDefault) {
          handlerConfig.properties[key] = descriptorProperty.defaultValue;
        }

        const secured = descriptorProperty.features.includes(PROPERTY_FEATURE_SECURED);

        if (secured) {
          const value = handlerConfig.properties[key];
          const propertyChanged = this.initialState?.secureProperties?.[key] !== value;

          if (propertyChanged) {
            handlerConfig.secureProperties[key] = toJS(value);
          } else {
            delete handlerConfig.secureProperties[key];
          }

          delete handlerConfig.properties[key];
        }
      }

      if (this.formState.state.submitType === 'submit') {
        if (Object.keys(handlerConfig.secureProperties).length === 0) {
          delete handlerConfig.secureProperties;
        }

        if (Object.keys(handlerConfig.properties).length === 0) {
          delete handlerConfig.properties;
        }
      }
    }

    if (handler.enabled && !handler.savePassword) {
      credentialsState.requireNetworkHandler(handler.id);
    }

    if (this.isChanged) {
      this.state = trimSSLConfig(handlerConfig);
      const sslConfigIndex = optionsPart.state.networkHandlersConfig?.findIndex(h => (handlerConfig.id || SSL_CODE_NAME) === h.id);

      if (!isNotNullDefined(sslConfigIndex)) {
        return;
      }

      if (sslConfigIndex !== -1) {
        optionsPart.state.networkHandlersConfig![sslConfigIndex] = this.state;
      } else {
        optionsPart.state.networkHandlersConfig?.push(this.state);
      }
    }
  }

  protected override async saveChanges(
    data: IFormState<IConnectionFormStateRefactored>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormStateRefactored>>,
  ): Promise<void> {}
}

function trimSSLConfig(input: INetworkHandlerConfig): INetworkHandlerConfig {
  const { secureProperties } = input;

  if (!secureProperties) {
    return input;
  }

  if (!Object.keys(secureProperties).length) {
    return input;
  }

  for (const key in secureProperties) {
    if (typeof secureProperties[key] === 'string') {
      secureProperties[key] = secureProperties[key]?.trim();
    }
  }

  return input;
}
