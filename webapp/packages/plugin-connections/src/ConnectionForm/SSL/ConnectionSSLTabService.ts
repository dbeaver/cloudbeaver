/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, toJS } from 'mobx';
import React from 'react';

import { DBDriverResource, NetworkHandlerResource } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import type { NetworkHandlerConfigInput } from '@cloudbeaver/core-sdk';
import { formStateContext } from '@cloudbeaver/core-ui';
import { isNotNullDefined, isObjectsEqual } from '@cloudbeaver/core-utils';

import { connectionFormConfigureContext } from '../connectionFormConfigureContext.js';
import { ConnectionFormService } from '../ConnectionFormService.js';
import { connectionConfigContext } from '../Contexts/connectionConfigContext.js';
import { connectionCredentialsStateContext } from '../Contexts/connectionCredentialsStateContext.js';
import type { IConnectionFormFillConfigData, IConnectionFormState, IConnectionFormSubmitData } from '../IConnectionFormProps.js';
import { getSSLDefaultConfig } from './getSSLDefaultConfig.js';
import { getSSLDriverHandler } from './getSSLDriverHandler.js';
import { PROPERTY_FEATURE_SECURED } from './PROPERTY_FEATURE_SECURED.js';
import { SSL_CODE_NAME } from './SSL_CODE_NAME.js';

export const SSLTab = React.lazy(async () => {
  const { SSLTab } = await import('./SSLTab.js');
  return { default: SSLTab };
});
export const SSLPanel = React.lazy(async () => {
  const { SSLPanel } = await import('./SSLPanel.js');
  return { default: SSLPanel };
});

@injectable()
export class ConnectionSSLTabService extends Bootstrap {
  constructor(
    private readonly connectionFormService: ConnectionFormService,
    private readonly dbDriverResource: DBDriverResource,
    private readonly networkHandlerResource: NetworkHandlerResource,
  ) {
    super();

    makeObservable<this, 'fillConfig' | 'prepareConfig'>(this, {
      fillConfig: action,
      prepareConfig: action,
    });
  }

  override register(): void {
    this.connectionFormService.tabsContainer.add({
      key: 'ssl',
      order: 4,
      tab: () => SSLTab,
      panel: () => SSLPanel,
      isHidden: (_, props) => {
        if (props?.state.config.driverId) {
          const driver = this.dbDriverResource.get(props.state.config.driverId);
          const handler = getSSLDriverHandler(this.networkHandlerResource.values, driver?.applicableNetworkHandlers ?? []);
          return !handler;
        }

        return true;
      },
    });

    this.connectionFormService.prepareConfigTask.addHandler(this.prepareConfig.bind(this));

    this.connectionFormService.formStateTask.addHandler(this.formState.bind(this));

    this.connectionFormService.configureTask.addHandler(this.configure.bind(this));

    this.connectionFormService.fillConfigTask.addHandler(this.fillConfig.bind(this));
  }

  private async fillConfig({ state, updated }: IConnectionFormFillConfigData, contexts: IExecutionContextProvider<IConnectionFormFillConfigData>) {
    if (!updated || !state.config.driverId) {
      return;
    }

    const driver = await this.dbDriverResource.load(state.config.driverId);
    const handlers = await this.networkHandlerResource.load(CachedMapAllKey);

    const handler = getSSLDriverHandler(handlers, driver?.applicableNetworkHandlers ?? []);

    if (!handler) {
      return;
    }

    const initialConfig = state.info?.networkHandlersConfig?.find(h => h.id === handler.id);

    if (!state.config.networkHandlersConfig) {
      state.config.networkHandlersConfig = [];
    }

    if (!state.config.networkHandlersConfig.some(state => state.id === handler.id)) {
      const config: NetworkHandlerConfigInput = initialConfig ? toJS(initialConfig) : getSSLDefaultConfig(handler.id);

      if (config.secureProperties) {
        config.properties = { ...config.properties, ...config.secureProperties };
      }

      state.config.networkHandlersConfig.push(config);
    }
  }

  private configure(data: IConnectionFormState, contexts: IExecutionContextProvider<IConnectionFormState>) {
    const configuration = contexts.getContext(connectionFormConfigureContext);

    configuration.include('includeNetworkHandlersConfig');
  }

  private async prepareConfig({ state, submitType }: IConnectionFormSubmitData, contexts: IExecutionContextProvider<IConnectionFormSubmitData>) {
    const config = contexts.getContext(connectionConfigContext);
    const credentialsState = contexts.getContext(connectionCredentialsStateContext);

    if (!state.config.networkHandlersConfig || state.config.networkHandlersConfig.length === 0 || !state.config.driverId) {
      return;
    }

    const driver = await this.dbDriverResource.load(state.config.driverId);
    const handlers = await this.networkHandlerResource.load(CachedMapAllKey);
    const handler = state.config.networkHandlersConfig.find(
      handler => driver?.applicableNetworkHandlers.includes(handler.id) && handlers.some(h => h.id === handler.id && h.codeName === SSL_CODE_NAME),
    );
    const descriptor = handlers.find(h => h.id === handler?.id);

    if (!handler) {
      return;
    }

    const initial = state.info?.networkHandlersConfig?.find(h => h.id === handler.id);
    const handlerConfig: NetworkHandlerConfigInput = toJS(handler);
    handlerConfig.savePassword = handler.savePassword || config.sharedCredentials;

    const changed = this.isChanged(handlerConfig, initial);

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

      if (submitType === 'submit') {
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

      this.trimSSLConfig(handlerConfig);
      config.networkHandlersConfig.push(handlerConfig);
    }
  }

  private trimSSLConfig(input: NetworkHandlerConfigInput) {
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
}
