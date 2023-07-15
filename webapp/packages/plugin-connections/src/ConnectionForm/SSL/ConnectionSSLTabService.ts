/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable } from 'mobx';
import React from 'react';

import { DBDriverResource, NetworkHandlerResource } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { CachedMapAllKey, type NetworkHandlerConfigInput } from '@cloudbeaver/core-sdk';
import { isObjectsEqual } from '@cloudbeaver/core-utils';

import { connectionFormConfigureContext } from '../connectionFormConfigureContext';
import { ConnectionFormService } from '../ConnectionFormService';
import { connectionConfigContext } from '../Contexts/connectionConfigContext';
import { connectionCredentialsStateContext } from '../Contexts/connectionCredentialsStateContext';
import { connectionFormStateContext } from '../Contexts/connectionFormStateContext';
import type { IConnectionFormFillConfigData, IConnectionFormState, IConnectionFormSubmitData } from '../IConnectionFormProps';
import { SSL_CODE_NAME } from './SSL_CODE_NAME';

export const SSLTab = React.lazy(async () => {
  const { SSLTab } = await import('./SSLTab');
  return { default: SSLTab };
});
export const SSLPanel = React.lazy(async () => {
  const { SSLPanel } = await import('./SSLPanel');
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

  register(): void {
    this.connectionFormService.tabsContainer.add({
      key: 'ssl',
      order: 4,
      tab: () => SSLTab,
      panel: () => SSLPanel,
      isHidden: (_, props) => {
        if (props?.state.config.driverId) {
          const driver = this.dbDriverResource.get(props.state.config.driverId);
          const handler = this.networkHandlerResource.values.find(
            handler => driver?.applicableNetworkHandlers.includes(handler.id) && handler.codeName === SSL_CODE_NAME,
          );

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

  load(): void {}

  private async fillConfig({ state, updated }: IConnectionFormFillConfigData, contexts: IExecutionContextProvider<IConnectionFormFillConfigData>) {
    if (!updated || !state.config.driverId) {
      return;
    }

    const driver = this.dbDriverResource.get(state.config.driverId);

    const handlers = await this.networkHandlerResource.load(CachedMapAllKey);
    const handler = handlers.find(handler => driver?.applicableNetworkHandlers.includes(handler.id) && handler.codeName === SSL_CODE_NAME);

    if (!handler) {
      return;
    }

    const initialConfig = state.info?.networkHandlersConfig?.find(h => h.id === handler.id);

    if (!state.config.networkHandlersConfig) {
      state.config.networkHandlersConfig = [];
    }

    if (!state.config.networkHandlersConfig.some(state => state.id === handler.id)) {
      state.config.networkHandlersConfig.push({
        id: initialConfig?.id ?? handler.id,
        enabled: initialConfig?.enabled ?? false,
        properties: initialConfig?.properties ?? {},
      });
    }
  }

  private configure(data: IConnectionFormState, contexts: IExecutionContextProvider<IConnectionFormState>) {
    const configuration = contexts.getContext(connectionFormConfigureContext);

    configuration.include('includeNetworkHandlersConfig');
  }

  private async prepareConfig({ state }: IConnectionFormSubmitData, contexts: IExecutionContextProvider<IConnectionFormSubmitData>) {
    const config = contexts.getContext(connectionConfigContext);
    const credentialsState = contexts.getContext(connectionCredentialsStateContext);

    if (!state.config.networkHandlersConfig || state.config.networkHandlersConfig.length === 0) {
      return;
    }

    const handlers = await this.networkHandlerResource.load(CachedMapAllKey);
    const handler = state.config.networkHandlersConfig.find(handler => handlers.some(h => h.id === handler.id && h.codeName === SSL_CODE_NAME));

    if (!handler) {
      return;
    }

    const initial = state.info?.networkHandlersConfig?.find(h => h.id === handler.id);
    const handlerConfig = { ...handler };

    if (handler.enabled && !handler.savePassword) {
      credentialsState.requireNetworkHandler(handler.id);
    }

    if (handlerConfig) {
      if (!config.networkHandlersConfig) {
        config.networkHandlersConfig = [];
      }

      config.networkHandlersConfig.push(handlerConfig);
    }
  }

  private formState(data: IConnectionFormState, contexts: IExecutionContextProvider<IConnectionFormState>) {
    const config = contexts.getContext(connectionConfigContext);
    if (config.networkHandlersConfig !== undefined) {
      const stateContext = contexts.getContext(connectionFormStateContext);

      stateContext.markEdited();
    }
  }

  private isChanged(handler: NetworkHandlerConfigInput, initial?: NetworkHandlerConfigInput) {
    if (!initial && !handler.enabled) {
      return false;
    }

    if (handler.enabled !== initial?.enabled || !isObjectsEqual(handler.properties, initial?.properties)) {
      return true;
    }

    return false;
  }
}
