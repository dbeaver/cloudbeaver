/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { FormPart, formSubmitContext, type IFormState } from '@cloudbeaver/core-ui';

import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import type { IConnectionFormState } from '../IConnectionFormState.js';
import { type NetworkHandlerConfigInput } from '@cloudbeaver/core-sdk';
import { isNotNullDefined } from '@cloudbeaver/core-utils';
import { getSSLDriverHandler } from './getSSLDriverHandler.js';
import { ConnectionInfoNetworkHandlersResource, type DBDriverResource, type NetworkHandlerResource } from '@cloudbeaver/core-connections';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { makeObservable, observable, toJS } from 'mobx';
import { PROPERTY_FEATURE_SECURED } from './PROPERTY_FEATURE_SECURED.js';
import { SSL_CODE_NAME } from './SSL_CODE_NAME.js';
import type { INetworkHandlerConfig } from '../Options/IConnectionNetworkHanler.js';
import { getSSLDefaultConfig } from './getSSLDefaultConfig.js';
import { ConnectionFormOptionsPart } from '../Options/ConnectionFormOptionsPart.js';

const getDefaultState = () =>
  ({
    id: SSL_CODE_NAME,
    enabled: false,
    properties: {},
    secureProperties: {},
  }) as INetworkHandlerConfig;

export class ConnectionFormSSLPart extends FormPart<INetworkHandlerConfig, IConnectionFormState> {
  private activeDriverId: string | undefined;
  constructor(
    formState: IFormState<IConnectionFormState>,
    private readonly dbDriverResource: DBDriverResource,
    private readonly networkHandlerResource: NetworkHandlerResource,
    private readonly connectionInfoNetworkHandlersResource: ConnectionInfoNetworkHandlersResource,
    private readonly optionsPart: ConnectionFormOptionsPart,
  ) {
    super(formState, getDefaultState());

    this.activeDriverId = undefined;

    makeObservable<this, 'activeDriverId'>(this, {
      activeDriverId: observable,
    });
  }

  override isLoaded(): boolean {
    return super.isLoaded() && this.activeDriverId === this.optionsPart.state.driverId;
  }

  override isOutdated(): boolean {
    const isDriverOutdated = Boolean(this.optionsPart.state.driverId && this.dbDriverResource.isOutdated(this.optionsPart.state.driverId));
    const isNetworkHandlerOutdated = this.networkHandlerResource.isOutdated(CachedMapAllKey);
    const isConnectionInfoNetworkHandlersOutdated = this.optionsPart.connectionKey
      ? this.connectionInfoNetworkHandlersResource.isOutdated(this.optionsPart.connectionKey)
      : false;

    return isDriverOutdated || isNetworkHandlerOutdated || isConnectionInfoNetworkHandlersOutdated;
  }

  protected override async loader(): Promise<void> {
    this.activeDriverId = this.optionsPart.state.driverId;

    if (!this.optionsPart.state.driverId) {
      this.setInitialState(getDefaultState());
      return;
    }

    const [driver, handlers] = await Promise.all([
      this.dbDriverResource.load(this.optionsPart.state.driverId),
      this.networkHandlerResource.load(CachedMapAllKey),
    ]);
    const handler = getSSLDriverHandler(handlers, driver?.applicableNetworkHandlers ?? []);

    if (!handler) {
      this.setInitialState(getDefaultState());
      return;
    }

    const info = this.optionsPart.connectionKey ? await this.connectionInfoNetworkHandlersResource.load(this.optionsPart.connectionKey) : null;
    const initialConfig = info?.networkHandlersConfig?.find(h => h.id === handler.id);

    if (!this.optionsPart.state.networkHandlersConfig?.some(state => state.id === handler.id)) {
      const config: NetworkHandlerConfigInput = initialConfig ? toJS(initialConfig) : getSSLDefaultConfig(handler.id);

      if (config.secureProperties) {
        config.properties = { ...config.properties, ...config.secureProperties };
      }

      this.setInitialState(config);
      return;
    }

    this.setInitialState(initialConfig ?? getDefaultState());
  }

  protected override async format(
    data: IFormState<IConnectionFormState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormState>>,
  ): Promise<void> {
    if (!this.optionsPart.state.driverId) {
      return;
    }

    const handlers = await this.networkHandlerResource.load(CachedMapAllKey);
    const descriptor = handlers.find(h => h.id === this.state?.id);

    const handlerConfig: NetworkHandlerConfigInput = toJS(this.state);
    handlerConfig.savePassword = this.state.savePassword || this.optionsPart.state.sharedCredentials;

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

      const submitInfo = contexts.getContext(formSubmitContext);
      if (submitInfo.type === 'submit') {
        if (Object.keys(handlerConfig.secureProperties).length === 0) {
          delete handlerConfig.secureProperties;
        }

        if (Object.keys(handlerConfig.properties).length === 0) {
          delete handlerConfig.properties;
        }
      }
    }

    if (this.state.enabled && !this.state.savePassword) {
      this.formState.state.requiredNetworkHandlersIds.push(this.state.id);
    } else if (!this.state.enabled) {
      this.formState.state.requiredNetworkHandlersIds = this.formState.state.requiredNetworkHandlersIds.filter(id => id !== this.state.id);
    }

    if (handlerConfig) {
      trimSSLConfig(handlerConfig);

      this.optionsPart.state.networkHandlersConfig!.push(handlerConfig);
    }
  }

  protected override async saveChanges(
    data: IFormState<IConnectionFormState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormState>>,
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
