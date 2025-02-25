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
import type { NetworkHandlerConfigInput } from '@cloudbeaver/core-sdk';
import { isNotNullDefined, isObjectsEqual } from '@cloudbeaver/core-utils';
import { getSSLDriverHandler } from './getSSLDriverHandler.js';
import {
  createConnectionParam,
  type ConnectionInfoResource,
  type DBDriverResource,
  type NetworkHandlerResource,
} from '@cloudbeaver/core-connections';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';
import { getSSLDefaultConfig } from './getSSLDefaultConfig.js';
import { toJS } from 'mobx';
import { connectionCredentialsStateContext } from '../Contexts/connectionCredentialsStateContext.js';
import { PROPERTY_FEATURE_SECURED } from './PROPERTY_FEATURE_SECURED.js';
import { SSL_CODE_NAME } from './SSL_CODE_NAME.js';

export class ConnectionFormSSLPart extends FormPart<void, IConnectionFormStateRefactored> {
  constructor(
    formState: IFormState<IConnectionFormStateRefactored>,
    private readonly dbDriverResource: DBDriverResource,
    private readonly networkHandlerResource: NetworkHandlerResource,
    private readonly connectionInfoResource: ConnectionInfoResource,
  ) {
    super(formState);
  }

  protected override async loader(): Promise<void> {
    if (!this.isChanged || !this.formState.state.driverId) {
      return;
    }

    const driver = await this.dbDriverResource.load(this.formState.state.driverId);
    const handlers = await this.networkHandlerResource.load(CachedMapAllKey);

    const optionsPart = getConnectionFormOptionsPart(this.formState);
    const handler = getSSLDriverHandler(handlers, driver?.applicableNetworkHandlers ?? []);
    const info = this.connectionInfoResource.get(
      createConnectionParam({
        id: this.formState.state.connectionId,
        projectId: this.formState.state.projectId,
      }),
    );

    if (!handler) {
      return;
    }

    const initialConfig = info?.networkHandlersConfig?.find(h => h.id === handler.id);

    if (!optionsPart?.state.networkHandlersConfig) {
      optionsPart.state.networkHandlersConfig = [];
    }

    if (!optionsPart?.state.networkHandlersConfig.some(state => state.id === handler.id)) {
      const config: NetworkHandlerConfigInput = initialConfig ? toJS(initialConfig) : getSSLDefaultConfig(handler.id);

      if (config.secureProperties) {
        config.properties = { ...config.properties, ...config.secureProperties };
      }

      optionsPart?.state.networkHandlersConfig.push(config);
    }
  }

  protected override async format(
    data: IFormState<{ projectId: string; connectionId: string; driverId: string; submitType: 'submit' | 'test' }>,
    contexts: IExecutionContextProvider<IFormState<{ projectId: string; connectionId: string; driverId: string; submitType: 'submit' | 'test' }>>,
  ): Promise<void> {
    const optionsPart = getConnectionFormOptionsPart(this.formState);
    const config = optionsPart.state;
    const credentialsState = contexts.getContext(connectionCredentialsStateContext);
    const info = this.connectionInfoResource.get(
      createConnectionParam({
        id: data.state.connectionId,
        projectId: data.state.projectId,
      }),
    );

    if (!config.networkHandlersConfig || config.networkHandlersConfig.length === 0 || !config.driverId) {
      return;
    }

    const driver = await this.dbDriverResource.load(config.driverId);
    const handlers = await this.networkHandlerResource.load(CachedMapAllKey);
    const handler = config.networkHandlersConfig.find(
      handler => driver?.applicableNetworkHandlers.includes(handler.id) && handlers.some(h => h.id === handler.id && h.codeName === SSL_CODE_NAME),
    );
    const descriptor = handlers.find(h => h.id === handler?.id);

    if (!handler) {
      return;
    }

    const initial = info?.networkHandlersConfig?.find(h => h.id === handler.id);
    const handlerConfig: NetworkHandlerConfigInput = toJS(handler);
    handlerConfig.savePassword = handler.savePassword || config.sharedCredentials;

    const changed = isChanged(handlerConfig, initial);

    if (changed && descriptor) {
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
          const propertyChanged = initial?.secureProperties?.[key] !== value;

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

    if (changed) {
      if (!config.networkHandlersConfig) {
        config.networkHandlersConfig = [];
      }

      trimSSLConfig(handlerConfig);
      config.networkHandlersConfig.push(handlerConfig);
    }
  }

  protected override saveChanges(
    data: IFormState<IConnectionFormStateRefactored>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormStateRefactored>>,
  ): Promise<void> {
    return Promise.resolve();
  }
}

function trimSSLConfig(input: NetworkHandlerConfigInput) {
  const { secureProperties } = input;

  if (!secureProperties) {
    return;
  }

  if (!Object.keys(secureProperties).length) {
    return;
  }

  for (const key in secureProperties) {
    if (typeof secureProperties[key] === 'string') {
      secureProperties[key] = secureProperties[key]?.trim();
    }
  }
}

function isChanged(handler: NetworkHandlerConfigInput, initial?: NetworkHandlerConfigInput) {
  if (!initial && !handler.enabled) {
    return false;
  }

  const initialProperties = { ...(initial?.properties ?? {}), ...(initial?.secureProperties ?? {}) };

  if (
    handler.enabled !== initial?.enabled ||
    handler.savePassword !== initial?.savePassword ||
    !isObjectsEqual(handler.properties, initialProperties)
  ) {
    return true;
  }

  return false;
}
